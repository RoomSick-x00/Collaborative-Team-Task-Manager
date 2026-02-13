const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTeamCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}
