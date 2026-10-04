export const delay = (ms = 200 + Math.random() * 400) => new Promise<void>(r => setTimeout(r, ms))
