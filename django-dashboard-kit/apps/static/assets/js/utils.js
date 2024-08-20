// Função para obter o valor de um cookie específico
export function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Constante para armazenar o token CSRF
export const csrftoken = getCookie('csrftoken');

// Função para converter uma data em string para ISO format com milissegundos
export function formatDateToISOStringWithMilliseconds(dateString) {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');

    const localDate = new Date(year, month - 1, day, hour, minute);
    return localDate.toISOString();
}
