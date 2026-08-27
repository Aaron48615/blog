export function setToken(data: string) {
  return localStorage.setItem("token", data);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function delToken() {
  return localStorage.removeItem("token");
}
