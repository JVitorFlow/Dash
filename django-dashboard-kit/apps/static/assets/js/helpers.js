// Função genérica para exibir um spinner de carregamento
export function mostrarLoadingSpinner(spinnerId) {
    const spinnerElement = document.getElementById(spinnerId);
    if (spinnerElement) {
        spinnerElement.style.display = 'block';
    } else {
        console.error(`Elemento de carregamento com ID '${spinnerId}' não encontrado`);
    }
}

// Função genérica para esconder um spinner de carregamento
export function esconderLoadingSpinner(spinnerId) {
    const spinnerElement = document.getElementById(spinnerId);
    if (spinnerElement) {
        spinnerElement.style.display = 'none';
    } else {
        console.error(`Elemento de carregamento com ID '${spinnerId}' não encontrado`);
    }
}

export function calcularPercentual(atendidas, recebidas) {
    return recebidas > 0 
        ? ((atendidas / recebidas) * 100).toFixed(2) 
        : 0;
}

export function cumpreMeta(percentual) {
    return percentual == 100 ? "SIM" : "NÃO";
}



export function calcularPercentualAbandono(abandonadasAcimaUmMinuto, ligacoesRecebidas) {
    if (ligacoesRecebidas === 0) {
        return 0;
    }
    return ((abandonadasAcimaUmMinuto / ligacoesRecebidas) * 100).toFixed(2);
}
