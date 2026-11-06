//! Shared deterministic addition kernel. Full expression parser arrives in DEV-002.
/// Validates inputs and output so the UI never shows NaN or infinity as a result.
pub fn add(lhs: f64, rhs: f64) -> Result<f64, &'static str> {
    if !lhs.is_finite() || !rhs.is_finite() {
        return Err("Only finite numbers are supported");
    }
    let result = lhs + rhs;
    if !result.is_finite() {
        return Err("Result exceeds the supported numeric range");
    }
    Ok(result)
}

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// Returns a finite sum, or throws a JavaScript Error on invalid input.
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn add_numbers(lhs: f64, rhs: f64) -> Result<f64, JsValue> {
    add(lhs, rhs).map_err(|msg| JsValue::from_str(msg))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_integers() {
        assert_eq!(add(2.0, 2.0), Ok(4.0));
    }
    #[test]
    fn adds_negative_values() {
        assert_eq!(add(-3.0, 2.0), Ok(-1.0));
    }
    #[test]
    fn rejects_non_finite_inputs() {
        assert!(add(f64::NAN, 1.0).is_err());
    }
    #[test]
    fn rejects_overflow() {
        assert!(add(f64::MAX, f64::MAX).is_err());
    }
}
