//! Scientific expression grammar, shared by native Rust and WebAssembly.
use super::{finite, CalcError, MAX_DEPTH, MAX_LENGTH, MAX_OPERATIONS};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AngleMode {
    Radians,
    Degrees,
}

pub fn evaluate(input: &str, mode: AngleMode) -> Result<f64, CalcError> {
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
        mode,
    };
    let result = parser.expression(0)?;
    parser.skip_space();
    if parser.pos != parser.input.len() {
        return Err(CalcError::UnexpectedToken);
    }
    finite(result)
}

struct Parser<'a> {
    input: &'a [u8],
    pos: usize,
    operations: usize,
    mode: AngleMode,
}

impl Parser<'_> {
    fn skip_space(&mut self) {
        while self
            .input
            .get(self.pos)
            .is_some_and(u8::is_ascii_whitespace)
        {
            self.pos += 1;
        }
    }
    fn peek(&mut self) -> Option<u8> {
        self.skip_space();
        self.input.get(self.pos).copied()
    }
    fn eat(&mut self, token: u8) -> bool {
        if self.peek() == Some(token) {
            self.pos += 1;
            true
        } else {
            false
        }
    }
    fn tick(&mut self) -> Result<(), CalcError> {
        self.operations += 1;
        if self.operations > MAX_OPERATIONS {
            Err(CalcError::TooComplex)
        } else {
            Ok(())
        }
    }
    fn depth(depth: usize) -> Result<(), CalcError> {
        if depth >= MAX_DEPTH {
            Err(CalcError::TooComplex)
        } else {
            Ok(())
        }
    }
    fn expression(&mut self, depth: usize) -> Result<f64, CalcError> {
        Self::depth(depth)?;
        let mut lhs = self.term(depth)?;
        loop {
            let op = match self.peek() {
                Some(b'+') => b'+',
                Some(b'-') => b'-',
                _ => return Ok(lhs),
            };
            self.pos += 1;
            self.tick()?;
            let rhs = self.term(depth)?;
            lhs = finite(if op == b'+' { lhs + rhs } else { lhs - rhs })?;
        }
    }
    fn term(&mut self, depth: usize) -> Result<f64, CalcError> {
        let mut lhs = self.unary(depth)?;
        loop {
            let op = match self.peek() {
                Some(b'*') => b'*',
                Some(b'/') => b'/',
                _ => return Ok(lhs),
            };
            self.pos += 1;
            self.tick()?;
            let rhs = self.unary(depth)?;
            if op == b'/' && rhs == 0.0 {
                return Err(CalcError::DivisionByZero);
            }
            lhs = finite(if op == b'*' { lhs * rhs } else { lhs / rhs })?;
        }
    }
    // Unary minus binds less tightly than exponentiation: -3^2 = -(3^2).
    fn unary(&mut self, depth: usize) -> Result<f64, CalcError> {
        Self::depth(depth)?;
        if self.eat(b'+') {
            self.tick()?;
            self.unary(depth + 1)
        } else if self.eat(b'-') {
            self.tick()?;
            finite(-self.unary(depth + 1)?)
        } else {
            self.power(depth)
        }
    }
    // Exponentiation is right associative: 2^3^2 = 2^(3^2).
    fn power(&mut self, depth: usize) -> Result<f64, CalcError> {
        let lhs = self.postfix(depth)?;
        if self.eat(b'^') {
            self.tick()?;
            let rhs = self.unary(depth + 1)?;
            checked_power(lhs, rhs)
        } else {
            Ok(lhs)
        }
    }
    fn postfix(&mut self, depth: usize) -> Result<f64, CalcError> {
        let mut value = self.atom(depth)?;
        while self.eat(b'!') {
            self.tick()?;
            value = factorial(value)?;
        }
        Ok(value)
    }
    fn atom(&mut self, depth: usize) -> Result<f64, CalcError> {
        Self::depth(depth)?;
        if self.eat(b'(') {
            let result = self.expression(depth + 1)?;
            if !self.eat(b')') {
                return Err(CalcError::MissingClosingParenthesis);
            }
            return Ok(result);
        }
        match self.peek() {
            Some(ch) if ch.is_ascii_alphabetic() => self.identifier(depth),
            Some(_) => self.number(),
            None => Err(CalcError::UnexpectedToken),
        }
    }
    fn identifier(&mut self, depth: usize) -> Result<f64, CalcError> {
        let start = self.pos;
        while self
            .input
            .get(self.pos)
            .is_some_and(u8::is_ascii_alphabetic)
        {
            self.pos += 1;
        }
        let name = std::str::from_utf8(&self.input[start..self.pos])
            .map_err(|_| CalcError::InvalidCharacter)?;
        if !self.eat(b'(') {
            return match name {
                "pi" => Ok(std::f64::consts::PI),
                "e" => Ok(std::f64::consts::E),
                _ => Err(CalcError::UnknownFunction),
            };
        }
        self.tick()?;
        let first = self.expression(depth + 1)?;
        let second = if self.eat(b';') {
            Some(self.expression(depth + 1)?)
        } else {
            None
        };
        if !self.eat(b')') {
            return Err(CalcError::MissingClosingParenthesis);
        }
        match (name, second) {
            ("root", Some(n)) => nth_root(first, n),
            ("root", None) => Err(CalcError::InvalidArguments),
            (_, Some(_)) => Err(CalcError::InvalidArguments),
            ("sin", None) => finite(self.angle(first).sin()),
            ("cos", None) => finite(self.angle(first).cos()),
            ("tan", None) => finite(self.angle(first).tan()),
            ("asin", None) => {
                domain((-1.0..=1.0).contains(&first))?;
                finite(self.from_angle(first.asin()))
            }
            ("acos", None) => {
                domain((-1.0..=1.0).contains(&first))?;
                finite(self.from_angle(first.acos()))
            }
            ("atan", None) => finite(self.from_angle(first.atan())),
            ("sqrt", None) => {
                domain(first >= 0.0)?;
                finite(first.sqrt())
            }
            ("abs", None) => finite(first.abs()),
            ("ln", None) => {
                domain(first > 0.0)?;
                finite(first.ln())
            }
            ("log", None) => {
                domain(first > 0.0)?;
                finite(first.log10())
            }
            ("exp", None) => finite(first.exp()),
            _ => Err(CalcError::UnknownFunction),
        }
    }
    fn angle(&self, value: f64) -> f64 {
        match self.mode {
            AngleMode::Radians => value,
            AngleMode::Degrees => value.to_radians(),
        }
    }
    fn from_angle(&self, value: f64) -> f64 {
        match self.mode {
            AngleMode::Radians => value,
            AngleMode::Degrees => value.to_degrees(),
        }
    }
    fn number(&mut self) -> Result<f64, CalcError> {
        self.skip_space();
        let start = self.pos;
        let mut digits = 0usize;
        while self.input.get(self.pos).is_some_and(u8::is_ascii_digit) {
            digits += 1;
            self.pos += 1;
        }
        if matches!(self.input.get(self.pos), Some(b'.' | b',')) {
            self.pos += 1;
            while self.input.get(self.pos).is_some_and(u8::is_ascii_digit) {
                digits += 1;
                self.pos += 1;
            }
        }
        if digits == 0 {
            return Err(match self.input.get(self.pos) {
                None | Some(b')' | b'+' | b'-' | b'*' | b'/' | b'^') => CalcError::UnexpectedToken,
                Some(_) => CalcError::InvalidCharacter,
            });
        }
        let slice = std::str::from_utf8(&self.input[start..self.pos])
            .map_err(|_| CalcError::InvalidCharacter)?;
        let normalized = slice.replace(',', ".");
        let parsed: f64 = normalized.parse().map_err(|_| CalcError::InvalidNumber)?;
        finite(parsed)
    }
}

fn domain(condition: bool) -> Result<(), CalcError> {
    if condition {
        Ok(())
    } else {
        Err(CalcError::DomainError)
    }
}

fn checked_power(base: f64, exponent: f64) -> Result<f64, CalcError> {
    domain(!(base == 0.0 && exponent < 0.0))?;
    domain(!(base < 0.0 && exponent.fract() != 0.0))?;
    finite(base.powf(exponent))
}

fn factorial(value: f64) -> Result<f64, CalcError> {
    domain(value >= 0.0 && value.fract() == 0.0 && value <= 170.0)?;
    let mut answer = 1.0;
    for number in 2..=value as u32 {
        answer *= f64::from(number);
    }
    finite(answer)
}

fn nth_root(value: f64, degree: f64) -> Result<f64, CalcError> {
    domain(degree != 0.0)?;
    if value < 0.0 {
        domain(degree.fract() == 0.0 && degree.abs() % 2.0 == 1.0)?;
        finite(-(-value).powf(1.0 / degree))
    } else if value == 0.0 && degree < 0.0 {
        Err(CalcError::DomainError)
    } else {
        finite(value.powf(1.0 / degree))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn close(actual: f64, expected: f64) {
        assert!((actual - expected).abs() < 1e-11, "{actual} != {expected}");
    }
    #[test]
    fn powers_and_precedence() {
        for (input, expected) in [
            ("-3^2", -9.0),
            ("(-3)^2", 9.0),
            ("2^3^2", 512.0),
            ("2^-2", 0.25),
            ("5!", 120.0),
            ("2*3^2+1", 19.0),
            ("sqrt(9)+2", 5.0),
            ("root(27;3)", 3.0),
            ("root(-27;3)", -3.0),
            ("abs(-12)", 12.0),
            ("log(100)", 2.0),
            ("ln(e)", 1.0),
            ("10^2", 100.0),
            ("2,5^2", 6.25),
        ] {
            close(evaluate(input, AngleMode::Radians).unwrap(), expected);
        }
    }
    #[test]
    fn angle_modes() {
        close(evaluate("sin(30)", AngleMode::Degrees).unwrap(), 0.5);
        close(evaluate("sin(pi/2)", AngleMode::Radians).unwrap(), 1.0);
        close(evaluate("asin(0.5)", AngleMode::Degrees).unwrap(), 30.0);
        close(evaluate("acos(0)", AngleMode::Degrees).unwrap(), 90.0);
        close(evaluate("atan(1)", AngleMode::Degrees).unwrap(), 45.0);
        close(evaluate("cos(60)", AngleMode::Degrees).unwrap(), 0.5);
    }
    #[test]
    fn invalid_domains_and_syntax() {
        for input in [
            "sqrt(-1)",
            "log(0)",
            "ln(-2)",
            "asin(2)",
            "acos(-2)",
            "(-3)^0.5",
            "171!",
            "1.5!",
            "root(-8;2)",
            "root(4;0)",
            "root(1;2;3)",
            "2^^3",
            "sin()",
            "1e3",
            "3pi",
            "sin(30",
            "foo(4)",
        ] {
            assert!(evaluate(input, AngleMode::Radians).is_err(), "{input}");
        }
        assert_eq!(
            evaluate("sqrt(-1)", AngleMode::Radians),
            Err(CalcError::DomainError)
        );
        assert_eq!(
            evaluate("171!", AngleMode::Radians),
            Err(CalcError::DomainError)
        );
        assert_eq!(
            evaluate("1/0", AngleMode::Radians),
            Err(CalcError::DivisionByZero)
        );
    }
    #[test]
    fn inherited_arithmetic() {
        for (input, expected) in [
            ("2+3*4", 14.0),
            ("(2+3)*4", 20.0),
            ("--3", 3.0),
            ("2,5+1.25", 3.75),
            ("20/5*2", 8.0),
        ] {
            close(evaluate(input, AngleMode::Radians).unwrap(), expected);
        }
    }
}
