export function emailLayout(titleColor: string, title: string, body: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
      <h2 style="color:${titleColor};">${title}</h2>
      ${body}
    </div>
  `;
}
