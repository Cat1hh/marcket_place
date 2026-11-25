const loginPage = "./cadastro.html?modo=entrar";
const profilePage = "./bancodedados.html";
const apiBase = "/api/";
const states = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

function formatDigits(value, field) {
  const digits = value.replace(/\D/g, "");
  if (field === "cpf") {
    return digits.slice(0, 11).replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2").replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
  }
  if (field === "postal_code") {
    return digits.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
  }
  const phone = digits.slice(0, 11);
  if (phone.length < 3) return phone;
  const subscriber = phone.slice(2);
  const prefixLength = subscriber.length > 8 ? 5 : 4;
  const suffix = subscriber.slice(prefixLength);
  return "(" + phone.slice(0, 2) + ") " + subscriber.slice(0, prefixLength) + (suffix ? "-" + suffix : "");
}

function addProfileFields() {
  const template = document.querySelector("#profile-fields");
  const fields = document.querySelector("[data-profile-fields]");
  fields.append(template.content.cloneNode(true));
  const select = fields.querySelector("select");
  select.add(new Option("Selecione", ""));
  for (const state of states) select.add(new Option(state, state));

  for (const field of fields.querySelectorAll('[name="cpf"], [name="phone"], [name="postal_code"]')) {
    if (!field.readOnly) {
      field.addEventListener("blur", () => { field.value = formatDigits(field.value, field.name); });
    }
  }
}

async function api(path, method = "GET", data) {
  let response;
  try {
    response = await fetch(apiBase + path, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(result?.error || "Não foi possível concluir a operação.");
    error.status = response.status;
    throw error;
  }
  if (result === null && response.status !== 204) {
    throw new Error("Resposta inválida do servidor.");
  }
  return result;
}

function feedback(element, message, isError = false) {
  element.toggleAttribute("data-error", isError);
  element.textContent = message;
}

function onSubmit(form, handler) {
  const button = form.querySelector("button[type=submit]");
  const status = form.querySelector(".feedback");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    button.disabled = true;
    feedback(status, "");
    try {
      await handler(Object.fromEntries(new FormData(form)), status);
    } catch (error) {
      if (error.status === 401 && document.body.dataset.page === "profile") {
        location.replace(loginPage);
        return;
      }
      feedback(status, error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

function showAccessMode(mode) {
  for (const tab of document.querySelectorAll("[data-mode]")) {
    if (tab.dataset.mode === mode) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  }
  document.querySelector("#register-panel").hidden = mode !== "register";
  document.querySelector("#login-panel").hidden = mode !== "login";
}

function startAccess() {
  const mode = new URLSearchParams(location.search).get("modo") === "entrar" ? "login" : "register";
  const register = document.querySelector("#register-form");
  const login = document.querySelector("#login-form");
  showAccessMode(mode);

  onSubmit(register, async (data) => {
    await api("register", "POST", data);
    register.reset();
    history.replaceState(null, "", loginPage);
    showAccessMode("login");
    login.elements.email.value = data.email.trim();
    feedback(login.querySelector(".feedback"), "Conta criada.");
    login.elements.password.focus();
  });
  onSubmit(login, async (data) => {
    await api("login", "POST", data);
    location.replace(profilePage);
  });
}

function showProfile(form, profile) {
  for (const [name, value] of Object.entries(profile)) {
    const field = form.elements.namedItem(name);
    if (!field) continue;
    field.value = ["cpf", "phone", "postal_code"].includes(name) ? formatDigits(value, name) : value;
  }
}

async function startProfile() {
  const form = document.querySelector("#profile-form");
  const password = document.querySelector("#password-form");
  const logout = document.querySelector("#logout");
  const status = document.querySelector("#profile-status");

  logout.addEventListener("click", async () => {
    logout.disabled = true;
    try {
      await api("logout", "POST", {});
      location.replace(loginPage);
    } catch (error) {
      feedback(status, error.message, true);
      logout.disabled = false;
    }
  });

  try {
    showProfile(form, await api("profile"));
    document.querySelector("#profile-panel").hidden = false;
    document.querySelector("#security-panel").hidden = false;
    feedback(status, "");
  } catch (error) {
    if (error.status === 401) location.replace(loginPage);
    else feedback(status, error.message, true);
    return;
  }

  onSubmit(form, async (data, status) => {
    delete data.cpf;
    await api("profile", "PUT", data);
    feedback(status, "Dados atualizados com sucesso.");
  });
  onSubmit(password, async (data, status) => {
    await api("password", "PUT", data);
    password.reset();
    feedback(status, "Senha alterada com sucesso.");
  });
}

addProfileFields();
if (document.body.dataset.page === "access") startAccess();
else startProfile();
