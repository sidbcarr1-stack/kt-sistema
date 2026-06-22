// ==================== CÁLCULOS AUTOMÁTICOS ====================
function getC(id) { return parseCurrency(document.getElementById('in_' + id)?.value || ''); }
function getD(id) { return parseDecimal(document.getElementById('in_' + id)?.value || ''); }
function setCalc(id, val) { const el = document.getElementById('in_' + id); if (el) el.value = val > 0 ? fmtCurrency(val) : ''; }

function recalcular() {
    const V = getC('T') * getD('U'), Y = getC('W') * getD('X'), AB = getC('Z') * getD('AA'),
        AE = getC('AC') * getD('AD'), AH = getC('AF') * getD('AG'), AK = getC('AI') * getD('AJ'), AN = getC('AL') * getD('AM');
    setCalc('V', V); setCalc('Y', Y); setCalc('AB', AB); setCalc('AE', AE); setCalc('AH', AH); setCalc('AK', AK); setCalc('AN', AN);
    const AQ = getC('S') + V + Y + AB + AE + AH + AK + AN + getC('AP'); setCalc('AQ', AQ);
    const AR = getC('AR');
    const asEl = document.getElementById('in_AS');
    if (asEl) {
        if (AR > 0 || (AR === 0 && document.getElementById('in_AR').value.trim() !== '')) {
            asEl.value = fmtCurrency(AQ - AR);
        } else { asEl.value = ''; }
    }
    if (!auOverridden) { const auEl = document.getElementById('in_AU'); if (auEl) auEl.value = AQ > 0 ? fmtCurrency(AQ) : ''; }
}

function sincronizarAW() {
    const bnEl = document.getElementById('in_BN');
    const awEl = document.getElementById('in_AW');
    if (!bnEl || !awEl) return;
    awEl.value = bnEl.value.trim();
}

function calcDataPagamento() {
    const bkEl = document.getElementById('in_BK');
    const blEl = document.getElementById('in_BL');
    const bmEl = document.getElementById('in_BM');
    const bnEl = document.getElementById('in_BN');
    if (!bnEl) return;
    if (!bkEl || !bkEl.value) { bnEl.value = ''; sincronizarAW(); return; }
    const blValor = parseInt(blEl?.value) || 0;
    const bmValor = parseInt(bmEl?.value) || 0;
    const dtBase = new Date(bkEl.value + 'T00:00:00');
    let diasParaSomar = 0;
    let usarBKdireto = false;
    if (bmValor > 0) { diasParaSomar = bmValor; }
    else if (blValor > 0) { diasParaSomar = blValor; }
    else { usarBKdireto = true; }
    if (usarBKdireto) {
        const dataFormatada = bkEl.value;
        const [ano, mes, dia] = dataFormatada.split('-');
        bnEl.value = `${dia}/${mes}/${ano}`;
    } else {
        const dt = new Date(dtBase);
        dt.setDate(dt.getDate() + diasParaSomar);
        bnEl.value = dt.toLocaleDateString('pt-BR');
    }
    sincronizarAW();
}

function calcGuincho() {
    const r = (document.getElementById('in_R')?.value || '').trim().toUpperCase();
    const mapUpper = Object.fromEntries(Object.entries(MAPA_GUINCHO).map(([k, v]) => [k.toUpperCase(), v]));
    const q = r && mapUpper.hasOwnProperty(r) ? mapUpper[r] : (r ? '' : '');
    const el = document.getElementById('in_Q'); if (el) el.value = q;
}

function onCurrencyInput(el) {
    // Permite digitar tanto "." quanto ","
    el.value = el.value.replace(/[^\d,.]/g, '');
}

function onCurrencyBlur(el) {
    const n = parseCurrency(el.value);
    el.value = el.value.trim() ? fmtCurrency(n) : '';
    recalcular();
}

function onDecimalInput(el) { el.value = el.value.replace(/[^\d,.]/g, ''); recalcular(); }

function applyPlateMask(el) {
    el.addEventListener('input', function () {
        let v = this.value.toUpperCase();

        // Verifica se tem "?" na placa ANTES de processar
        const temInterrogacao = v.includes('?');

        // Aplica estilo vermelho e negrito se tiver "?"
        if (temInterrogacao) {
            this.style.color = '#dc2626';
            this.style.fontWeight = 'bold';
        } else {
            this.style.color = '';
            this.style.fontWeight = '';
        }

        // Remove tudo exceto letras, números, "-" e "?"
        // Usando loop explícito para garantir que "?" seja mantido
        let cleaned = '';
        for (let i = 0; i < v.length; i++) {
            const char = v[i];
            if ((char >= 'A' && char <= 'Z') ||
                (char >= '0' && char <= '9') ||
                char === '-' ||
                char === '?') {
                cleaned += char;
            }
        }
        v = cleaned;

        // Remove hífens existentes para reformatar corretamente
        v = v.replace(/-/g, '');

        // Insere hífen após 3 caracteres
        if (v.length > 3) {
            v = v.slice(0, 3) + '-' + v.slice(3);
        }

        // Limita a 8 caracteres
        if (v.length > 8) {
            v = v.slice(0, 8);
        }

        this.value = v;
    });
}

function onInstituicaoChange() {
    const inst = (document.getElementById('in_B').value || '').trim().toUpperCase();
    const selC = document.getElementById('in_C'), selF = document.getElementById('in_F');
    if (!inst) {
        selC.innerHTML = '<option value="">Selecione a Instituição...</option>'; selC.disabled = true;
        selF.innerHTML = '<option value="">Selecione a Instituição...</option>'; selF.disabled = true;
        return;
    }
    const assists = [...new Set(assistRows.filter(r => (r[0] || '').trim().toUpperCase() === inst && (r[1] || '').trim()).map(r => r[1].trim()))].sort();
    fillSelect('in_C', assists); selC.disabled = false;
    const sits = [...new Set(situRows.filter(r => (r[0] || '').trim().toUpperCase() === inst && (r[1] || '').trim()).map(r => r[1].trim()))].sort();
    fillSelect('in_F', sits); selF.disabled = false;
}