// Hàm tính check digit theo thuật toán Luhn (Mod10)
function calculateCheckDigit(code) {
  let sum = 0;
  let doubleDigit = false;
  for (let i = code.length - 1; i >= 0; i--) {
    let digit = parseInt(code[i], 10);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return (10 - (sum % 10)) % 10;
}

// Hàm sinh work_code tự động: format "WO" + YYYYMMDD + 4 số ngẫu nhiên + check digit
function generateWorkCode() {
  const datePart = new Date().toISOString().slice(0,10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  const baseCode = `WO${datePart}${randomPart}`; // Ví dụ: WO202506011234
  const checkDigit = calculateCheckDigit(baseCode.replace(/\D/g, '')); // chỉ lấy số để tính
  return baseCode + checkDigit; // WO2025060112345
}

module.exports = {
  calculateCheckDigit,
  generateWorkCode,
};