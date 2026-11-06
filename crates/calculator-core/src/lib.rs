//! Shared deterministic f64 calculator engine, used natively and through WebAssembly.
//! Grammar: expression -> term (('+' | '-') term)*;
//! term -> unary (('*' | '/') unary)*;
//! unary -> ('+' | '-') unary | primary;
//! primary -> decimal | '(' expression ')'.
//! Later DEV steps add powers and scientific operators.
const MAX_LENGTH: usize = 4096;
const MAX_DEPTH: usize = 64;
const MAX_OPERATIONS: usize = 4096;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CalcError {
    EmptyExpression,
    ExpressionTooLong,
    InvalidCharacter,
    InvalidNumber,
    UnexpectedToken,
    MissingClosingParenthesis,
    DivisionByZero,
    NonFiniteResult,
    TooComplex,
}

impl CalcError {
    pub fn message(self) -> &'static str {
        match self {
            Self::EmptyExpression => "Ange ett uttryck.",
            Self::ExpressionTooLong => "Uttrycket är för långt (max 4096 tecken).",
            Self::InvalidCharacter => "Uttrycket innehåller ett ogiltigt tecken.",
            Self::InvalidNumber => "Ogiltigt tal i uttrycket.",
            Self::UnexpectedToken => "Ogiltig syntax i uttrycket.",
            Self::MissingClosingParenthesis => "En avslutande parentes saknas.",
            Self::DivisionByZero => "Division med noll är inte tillåten.",
            Self::NonFiniteResult => "Resultatet ligger utanför det tillåtna talområdet.",
            Self::TooComplex => "Uttrycket är för komplext.",
        }
    }
}

fn finite(value: f64) -> Result<f64, CalcError> {
    if value.is_finite() {
        Ok(value)
    } else {
        Err(CalcError::NonFiniteResult)
    }
}

/// Backwards-compatible API used by DEV-001.
pub fn add(lhs: f64, rhs: f64) -> Result<f64, &'static str> {
    if !lhs.is_finite() || !rhs.is_finite() {
        return Err("Only finite numbers are supported");
    }
    finite(lhs + rhs).map_err(|_| "Result exceeds the supported numeric range")
}

/// Evaluate a limited arithmetic expression. Both '.' and ',' are decimal separators.
/// In particular, this is NOT arbitrary Rust/JavaScript execution.
pub fn evaluate(input: &str) -> Result<f64, CalcError> {
    if input.len() > MAX_LENGTH {
        return Err(CalcError::ExpressionTooLong);
    }
    if input.trim().is_empty() {
        return Err(CalcError::EmptyExpression);
    }
    let mut parser = Parser {
        input: input.as_bytes(),
        pos: 0,
        operations: 0,
    };
    let value = parser.expression(0)?;
    parser.skip_spaces();
    if parser.pos != parser.input.len() {
        return Err(CalcError::UnexpectedToken);
    }
    finite(value)
}

struct Parser<'a> {
    input: &'a [u8],
    pos: usize,
    operations: usize,
}

impl Parser<'_> {
    fn skip_spaces(&mut self) {
        while self.pos < self.input.len() && self.input[self.pos].is_ascii_whitespace() {
            self.pos += 1;
        }
    }

    fn peek(&mut self) -> Option<u8> {
        self.skip_spaces();
        self.input.get(self.pos).copied()
    }

    fn consume(&mut self, ch: u8) -> bool {
        if self.peek() == Some(ch) {
            self.pos += 1;
            true
        } else {
            false
        }
    }

    fn count_operation(&mut self) -> Result<(), CalcError> {
        self.operations += 1;
        if self.operations > MAX_OPERATIONS {
            Err(CalcError::TooComplex)
        } else {
            Ok(())
        }
    }

    fn expression(&mut self, depth: usize) -> Result<f64, CalcError> {
        let mut left = self.term(depth)?;
        loop {
            let op = match self.peek() {
                Some(b'+') => b'+',
                Some(b'-') => b'-',
                _ => return Ok(left),
            };
            self.pos += 1;
            self.count_operation()?;
            let right = self.term(depth)?;
            left = finite(if op == b'+' {
                left + right
            } else {
                left - right
            })?;
        }
    }

    fn term(&mut self, depth: usize) -> Result<f64, CalcError> {
        let mut left = self.unary(depth)?;
        loop {
            let op = match self.peek() {
                Some(b'*') => b'*',
                Some(b'/') => b'/',
                _ => return Ok(left),
            };
            self.pos += 1;
            self.count_operation()?;
            let right = self.unary(depth)?;
            if op == b'/' && right == 0.0 {
                return Err(CalcError::DivisionByZero);
            }
            left = finite(if op == b'*' {
                left * right
            } else {
                left / right
            })?;
        }
    }

    fn unary(&mut self, depth: usize) -> Result<f64, CalcError> {
        if depth >= MAX_DEPTH {
            return Err(CalcError::TooComplex);
        }
        if self.consume(b'+') {
            self.count_operation()?;
            self.unary(depth + 1)
        } else if self.consume(b'-') {
            self.count_operation()?;
            finite(-self.unary(depth + 1)?)
        } else {
            self.primary(depth)
        }
    }

    fn primary(&mut self, depth: usize) -> Result<f64, CalcError> {
        if self.consume(b'(') {
            if depth >= MAX_DEPTH - 1 {
                return Err(CalcError::TooComplex);
            }
            let value = self.expression(depth + 1)?;
            if !self.consume(b')') {
                return Err(CalcError::MissingClosingParenthesis);
            }
            Ok(value)
        } else {
            self.number()
        }
    }

    fn number(&mut self) -> Result<f64, CalcError> {
        self.skip_spaces();
        let start = self.pos;
        let mut digits = 0usize;
        while self.input.get(self.pos).is_some_and(u8::is_ascii_digit) {
            digits += 1;
            self.pos += 1;
        }
        let mut separator = false;
        if matches!(self.input.get(self.pos), Some(b'.' | b',')) {
            separator = true;
            self.pos += 1;
            while self.input.get(self.pos).is_some_and(u8::is_ascii_digit) {
                digits += 1;
                self.pos += 1;
            }
        }
        if digits == 0 {
            return Err(match self.input.get(self.pos) {
                None | Some(b')' | b'+' | b'-' | b'*' | b'/') => CalcError::UnexpectedToken,
                Some(_) => CalcError::InvalidCharacter,
            });
        }
        let slice = std::str::from_utf8(&self.input[start..self.pos])
            .map_err(|_| CalcError::InvalidCharacter)?;
        let normalized = if separator {
            slice.replace(',', ".")
        } else {
            slice.to_owned()
        };
        let value: f64 = normalized.parse().map_err(|_| CalcError::InvalidNumber)?;
        finite(value)
    }
}

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn add_numbers(lhs: f64, rhs: f64) -> Result<f64, JsValue> {
    add(lhs, rhs).map_err(JsValue::from_str)
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn evaluate_expression(expression: &str) -> Result<f64, JsValue> {
    evaluate(expression).map_err(|err| JsValue::from_str(err.message()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn addition_regression() {
        assert_eq!(add(2.0, 2.0), Ok(4.0));
        assert_eq!(add(-3.0, 2.0), Ok(-1.0));
        assert!(add(f64::NAN, 1.0).is_err());
        assert!(add(f64::MAX, f64::MAX).is_err());
    }

    #[test]
    fn precedence_and_parentheses() {
        for (text, expected) in [
            ("2+3*4", 14.0),
            ("(2+3)*4", 20.0),
            ("20/5*2", 8.0),
            ("10-3-2", 5.0),
            ("18/(2+1)", 6.0),
            ("-3*-2", 6.0),
            ("--3", 3.0),
            ("+4", 4.0),
            ("2,5 + 1.25", 3.75),
            (".5+1", 1.5),
            ("2.", 2.0),
            (" 2 + 3 \t ", 5.0),
        ] {
            assert_eq!(evaluate(text), Ok(expected), "{text}");
        }
    }

    #[test]
    fn invalid_cases_are_errors() {
        for text in [
            "", " ", "1+", "(1+2", "1+)", "1 2", "1..2", "1,2,3", "2^3", "abc", "1e3", "2(3)",
            "1/0", "0/(-0)", "10/0.0", "2*(3))",
        ] {
            assert!(evaluate(text).is_err(), "unexpected acceptance: {text}");
        }
        assert_eq!(evaluate("1/0"), Err(CalcError::DivisionByZero));
        assert_eq!(evaluate("2*(3"), Err(CalcError::MissingClosingParenthesis));
        assert_eq!(evaluate(" "), Err(CalcError::EmptyExpression));
    }

    #[test]
    fn complexity_and_numeric_limits() {
        assert_eq!(
            evaluate(&"1".repeat(MAX_LENGTH + 1)),
            Err(CalcError::ExpressionTooLong)
        );
        assert_eq!(
            evaluate(&format!("{}1{}", "(".repeat(65), ")".repeat(65))),
            Err(CalcError::TooComplex)
        );
        assert_eq!(
            evaluate(&format!("{}1", "-".repeat(65))),
            Err(CalcError::TooComplex)
        );
        assert!(evaluate(&format!("{}*10", "9".repeat(308))).is_err());
    }

    #[test]
    fn many_short_expressions() {
        for a in -25..25 {
            for b in 1..25 {
                let expr = format!("({a}+{b})*2-{b}");
                assert_eq!(evaluate(&expr), Ok(((a + b) * 2 - b) as f64), "{expr}");
            }
        }
    }
}
