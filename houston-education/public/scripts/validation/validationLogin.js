
const form = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");
const btnLogin = document.getElementById("btnLogin");
const btnText = btnLogin.querySelector(".btn-text");
const btnSpinner = btnLogin.querySelector(".btn-spinner");

function setLoading(loading) {
    btnLogin.disabled = loading;
    btnText.classList.toggle("hidden", loading);
    btnSpinner.classList.toggle("hidden", !loading);
}

form.addEventListener("submit", async (e) => {
    e.preventDefault(); // pra não enviar o formulário direto

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    if (!data.email || !data.senha) { // validação do preenchimento dos campos
        mensagem.textContent = "Preencha todos os campos!";
        mensagem.style.color = "red";
        return;
    }

    setLoading(true);
    mensagem.textContent = "";

    try { // lógica de validação

        /*const API_URL = window.location.hostname === "localhost" ? "http://localhost:3000" : "https://projetointegeradormonitoria.onrender.com"; // verificando se está no render ou na nossa máquina*/

        const res = await fetch('/login', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await res.json(); // retornar o json e ver se há erros

        // trata todos os erros enviados pelo backend

        if (result.erro) {
            switch (result.erro) {
                case "CREDENCIAIS_INVALIDAS":
                case "USUARIO_INEXISTENTE":
                    mensagem.textContent = "Email ou senha incorretos!";
                    break;
                case "DADOS_INCOMPLETOS":
                    mensagem.textContent = "Preencha todos os campos!";
                    break;
                default:
                    mensagem.textContent = "Erro ao tentar logar!";
            }
            mensagem.style.color = "red";
            setLoading(false);
            return; // impede o redirecionamento
        }

        // se chegou aqui, login válido, redireciona para a home
        localStorage.setItem("token", result.token);
        window.location.href = "/pages/home.html";

    } catch (err) {
        mensagem.textContent = "Erro de rede ou servidor!";
        mensagem.style.color = "red";
        setLoading(false);
    }
});

// Toggle visibilidade da senha
const btnToggleSenhaLogin = document.getElementById("btnToggleSenhaLogin");
const inputSenhaLogin = document.getElementById("inputSenhaLogin");

if (btnToggleSenhaLogin && inputSenhaLogin) {
    btnToggleSenhaLogin.addEventListener("click", () => {
        const icone = btnToggleSenhaLogin.querySelector("i");
        if (inputSenhaLogin.type === "password") {
            inputSenhaLogin.type = "text";
            icone.classList.remove("fa-eye");
            icone.classList.add("fa-eye-slash");
        } else {
            inputSenhaLogin.type = "password";
            icone.classList.remove("fa-eye-slash");
            icone.classList.add("fa-eye");
        }
    });
}
