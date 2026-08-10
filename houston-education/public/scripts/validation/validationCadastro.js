
const form = document.getElementById("cadastroForm");
const mensagem = document.getElementById("mensagem");
const btnCadastrar = document.getElementById("btnCadastrar");
const btnText = btnCadastrar.querySelector(".btn-text");
const btnSpinner = btnCadastrar.querySelector(".btn-spinner");

function setLoading(loading, redirecting = false) {
    btnCadastrar.disabled = loading;
    if (redirecting) {
        btnText.textContent = "Redirecionando";
        btnText.classList.remove("hidden");
        btnSpinner.classList.remove("hidden");
    } else {
        btnText.textContent = "Cadastrar";
        btnText.classList.toggle("hidden", loading);
        btnSpinner.classList.toggle("hidden", !loading);
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault(); // evita redirecionamento padrão

    const formData = new FormData(form);
    const data = Object.fromEntries(formData); // dados que o usuário digitou

    if (!data.nome || !data.senha || !data.email || !data.matricula) {
        mensagem.textContent = "Preencha todos os campos.";
        mensagem.style.color = "red";
        return;
    }

    const matriculaRegex = /^\d{8,11}$/;
    if (!matriculaRegex.test(data.matricula)) {
        mensagem.textContent = "A matrícula deve conter entre 8 e 11 dígitos numéricos.";
        mensagem.style.color = "red";
        return;
    }

    setLoading(true);
    mensagem.textContent = "";

    try {
        const res = await fetch('/alunos', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!res.ok) {
            if (result.erro === "EMAIL_EXISTE" || result.erro === "MATRICULA_EXISTE") {
                mensagem.textContent = "Matrícula ou email já cadastrados";
            } else if (result.erro === "DADOS_INCOMPLETOS") {
                mensagem.textContent = "Preencha todos os campos corretamente!";
            } else if (result.errors) {
                mensagem.textContent = "Erro ao cadastrar! Verifique se a matrícula possui 8 dígitos!";
            } else {
                mensagem.textContent = "Erro ao cadastrar! Verifique se a matrícula possui 8 dígitos!";
            }
            mensagem.style.color = "red";
            setLoading(false);
        } else {
            setLoading(true, true);
            window.location.href = 'login.html';
        }

    } catch (err) {
        mensagem.textContent = "Erro ao cadastrar, usuário existente ou credenciais inválidas!";
        mensagem.style.color = "red";
        setLoading(false);
    }
});

// Toggle visibilidade da senha
const btnToggleSenhaCadastro = document.getElementById("btnToggleSenhaCadastro");
const inputSenhaCadastro = document.getElementById("inputSenhaCadastro");

if (btnToggleSenhaCadastro && inputSenhaCadastro) {
    btnToggleSenhaCadastro.addEventListener("click", () => {
        const icone = btnToggleSenhaCadastro.querySelector("i");
        if (inputSenhaCadastro.type === "password") {
            inputSenhaCadastro.type = "text";
            icone.classList.remove("fa-eye");
            icone.classList.add("fa-eye-slash");
        } else {
            inputSenhaCadastro.type = "password";
            icone.classList.remove("fa-eye-slash");
            icone.classList.add("fa-eye");
        }
    });
}