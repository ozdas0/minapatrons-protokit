export function generateUniqueId(): string {
  const randomNumber = Math.floor(Math.random() * 1e11);
  return randomNumber.toString().padStart(11, "0");
}
