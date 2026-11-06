//! Shared deterministic f64 calculator engine, used natively and through WebAssembly.
//! Bounded arithmetic and scientific expressions; no arbitrary code execution.

mod scientific;
pub use scientific::AngleMode;
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
    DomainError,
    UnknownFunction,
    InvalidArguments,
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
            Self::DomainError => "Funktionen är inte definierad för det angivna värdet.",
            Self::UnknownFunction => "Okänd matematisk funktion.",
            Self::InvalidArguments => "Fel antal argument till funktionen.",
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

/// Evaluate using radians by default; preserves the DEV-002 API.
pub fn evaluate(input: &str) -> Result<f64, CalcError> {
    scientific::evaluate(input, AngleMode::Radians)
}

/// Evaluate with the specified trigonometrical angle mode.
pub fn evaluate_with_mode(input: &str, mode: AngleMode) -> Result<f64, CalcError> {
    scientific::evaluate(input, mode)
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

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn evaluate_scientific(expression: &str, degrees: bool) -> Result<f64, JsValue> {
    let mode = if degrees {
        AngleMode::Degrees
    } else {
        AngleMode::Radians
    };
    evaluate_with_mode(expression, mode).map_err(|err| JsValue::from_str(err.message()))
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
            "", " ", "1+", "(1+2", "1+)", "1 2", "1..2", "1,2,3", "abc", "1e3", "2(3)", "1/0",
            "0/(-0)", "10/0.0", "2*(3))",
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
