const actions = [
  {
    id: 'embalagens',
    icon: '♻',
    title: 'Devolver embalagens',
    description: 'Leve embalagens vazias à clínica para reciclagem.',
    points: 30
  },
  {
    id: 'transporte',
    icon: '🚲',
    title: 'Transporte sustentável',
    description: 'Venha a pé, de bicicleta, ônibus ou carona.',
    points: 20
  },
  {
    id: 'reutilizaveis',
    icon: '🥤',
    title: 'Evitar descartáveis',
    description: 'Traga sua garrafa ou sacola reutilizável.',
    points: 15
  }
];

const rewards = [
  {
    id: 'desconto',
    icon: '🏷️',
    title: 'Desconto no atendimento',
    description: 'Benefício de desconto para o próximo atendimento.',
    cost: 100
  },
  {
    id: 'procedimento',
    icon: '✧',
    title: 'Procedimento complementar',
    description: 'Um procedimento complementar gratuito na clínica.',
    cost: 180
  },
  {
    id: 'presente',
    icon: '🎁',
    title: 'Amostra ou presente',
    description: 'Uma amostra ou produto de presente.',
    cost: 70
  }
];

const key = 'ecopalie-demo-v1';
const emptyState = () => ({ transactions: [] });
let state;

try {
  const saved = JSON.parse(localStorage.getItem(key));
  state = saved && Array.isArray(saved.transactions)
    ? saved
    : emptyState();
} catch {
  state = emptyState();
}

const $ = id => document.getElementById(id);
const save = () => localStorage.setItem(key, JSON.stringify(state));

const formatDate = date =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(date));

const confirmed = () =>
  state.transactions.filter(
    t => t.status === 'approved' && t.kind === 'action'
  );

const balance = () =>
  state.transactions.reduce(
    (total, t) => total + (t.status === 'approved' ? t.points : 0),
    0
  );

const countPackages = () =>
  confirmed().filter(t => t.actionId === 'embalagens').length;

const plasticGrams = () =>
  confirmed().filter(t => t.actionId === 'reutilizaveis').length * 15;

let toastTimeout;

function notify(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(
    () => $('toast').classList.remove('show'),
    3500
  );
}

function go(page) {
  document.querySelectorAll('.page').forEach(p =>
    p.classList.toggle('active', p.id === page)
  );

  document.querySelectorAll('.nav-link').forEach(b =>
    b.classList.toggle('active', b.dataset.page === page)
  );

  $('topPage').textContent = ({
    inicio: 'Visão geral',
    acoes: 'Minhas ações',
    historico: 'Histórico',
    impacto: 'Meu impacto',
    loja: 'Loja de vantagens',
    clinica: 'Área da clínica'
  })[page];

  $('sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const b = balance();

  $('balanceHome').textContent = b;
  $('shopBalance').textContent = b;
  $('packagesHome').textContent = countPackages();
  $('plasticHome').textContent = `${plasticGrams()} g`;
  $('impactPackages').textContent = countPackages();
  $('impactPlastic').textContent = `${plasticGrams()} g`;
  $('impactActions').textContent = confirmed().length;

  $('pendingCount').textContent =
    state.transactions.filter(t => t.status === 'pending').length;

  $('approvedCount').textContent = confirmed().length;

  renderHistory();
  renderPending();
  renderRewards();
}

function renderActions() {
  $('actionCards').innerHTML = actions.map(a => `
    <article class="action-card">
      <div class="large-icon">${a.icon}</div>
      <h3>${a.title}</h3>
      <p>${a.description}</p>
      <div class="points">✦ +${a.points} Eco-Moedas</div>
      <button class="btn btn-gold" data-action="${a.id}">
        Solicitar confirmação ↗
      </button>
    </article>
  `).join('');
}

function renderRewards() {
  $('rewardCards').innerHTML = rewards.map(r => `
    <article class="reward-card">
      <div class="large-icon">${r.icon}</div>
      <h3>${r.title}</h3>
      <p>${r.description}</p>
      <div class="points">✦ ${r.cost} Eco-Moedas</div>
      <button
        class="btn btn-gold"
        data-reward="${r.id}"
        ${balance() < r.cost ? 'disabled' : ''}
      >
        ${balance() < r.cost
          ? 'Saldo insuficiente'
          : 'Resgatar benefício ↗'}
      </button>
    </article>
  `).join('');

  document.querySelectorAll('[data-reward]:disabled').forEach(b => {
    b.style.opacity = '.5';
    b.style.cursor = 'not-allowed';
  });
}

function renderHistory() {
  const entries = [...state.transactions].reverse();

  $('historyCount').textContent =
    `${entries.length} movimentação(ões)`;

  $('historyList').innerHTML = entries.length
    ? entries.map(t => {
        const label = t.kind === 'reward'
          ? rewards.find(r => r.id === t.rewardId)?.title
          : actions.find(a => a.id === t.actionId)?.title;

        const status = t.status === 'pending'
          ? 'Pendente'
          : t.status === 'rejected'
            ? 'Recusada'
            : t.kind === 'reward'
              ? 'Resgatado'
              : 'Confirmada';

        return `
          <div class="history-item">
            <span class="round-icon">
              ${t.kind === 'reward'
                ? '🎁'
                : actions.find(a => a.id === t.actionId)?.icon}
            </span>
            <div class="history-main">
              <strong>${label || 'Movimentação'}</strong>
              <small>${formatDate(t.date)}</small>
            </div>
            <span class="tag ${
              t.status === 'approved'
                ? 'ok'
                : t.status === 'rejected'
                  ? 'no'
                  : ''
            }">${status}</span>
            <span class="history-amount ${
              t.points < 0 ? 'negative' : ''
            }">
              ${t.points > 0 ? '+' : ''}${t.points}
            </span>
          </div>
        `;
      }).join('')
    : '<div class="empty">Nenhuma movimentação ainda. Registre sua primeira ação sustentável.</div>';
}

function renderPending() {
  const pending = state.transactions.filter(
    t => t.status === 'pending'
  );

  $('pendingList').innerHTML = pending.length
    ? pending.map(t => {
        const a = actions.find(a => a.id === t.actionId);

        return `
          <div class="pending-item">
            <span class="round-icon">${a.icon}</span>
            <div class="pending-main">
              <strong>${a.title}</strong>
              <small>
                ${formatDate(t.date)} · +${a.points} Eco-Moedas
              </small>
            </div>
            <div class="pending-actions">
              <button class="small-btn" data-approve="${t.id}">
                ✓ Confirmar
              </button>
              <button class="small-btn reject" data-reject="${t.id}">
                Recusar
              </button>
            </div>
          </div>
        `;
      }).join('')
    : '<div class="empty">Nenhuma solicitação pendente no momento.</div>';
}

function requestAction(id) {
  const a = actions.find(item => item.id === id);
  if (!a) return;

  state.transactions.push({
    id: crypto.randomUUID(),
    kind: 'action',
    actionId: id,
    points: a.points,
    status: 'pending',
    date: new Date().toISOString()
  });

  save();
  render();
  notify('Solicitação enviada para confirmação da clínica.');
  go('historico');
}

function review(id, approved) {
  const t = state.transactions.find(
    item => item.id === id && item.status === 'pending'
  );

  if (!t) return;

  t.status = approved ? 'approved' : 'rejected';

  save();
  render();

  notify(
    approved
      ? 'Ação confirmada! Eco-Moedas creditadas.'
      : 'Solicitação recusada.'
  );
}

function redeem(id) {
  const r = rewards.find(item => item.id === id);

  if (!r || balance() < r.cost) return;

  if (!confirm(
    `Resgatar ${r.title} por ${r.cost} Eco-Moedas?`
  )) return;

  state.transactions.push({
    id: crypto.randomUUID(),
    kind: 'reward',
    rewardId: id,
    points: -r.cost,
    status: 'approved',
    date: new Date().toISOString()
  });

  save();
  render();

  notify(
    'Resgate registrado nesta demonstração. Consulte a clínica para validação.'
  );

  go('historico');
}

document.addEventListener('click', event => {
  const nav = event.target.closest('[data-page]');
  const jump = event.target.closest('[data-go]');
  const action = event.target.closest('[data-action]');
  const reward = event.target.closest('[data-reward]');
  const approve = event.target.closest('[data-approve]');
  const reject = event.target.closest('[data-reject]');

  if (nav) go(nav.dataset.page);
  if (jump) go(jump.dataset.go);
  if (action) requestAction(action.dataset.action);
  if (reward) redeem(reward.dataset.reward);
  if (approve) review(approve.dataset.approve, true);
  if (reject) review(reject.dataset.reject, false);
});

$('menuToggle').addEventListener('click', () =>
  $('sidebar').classList.toggle('open')
);

$('year').textContent = new Date().getFullYear();

renderActions();
render();
