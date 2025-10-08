interface Member {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  paidById: number;
  paidForIds: number[];
}

interface Transaction {
  from: number;
  to: number;
  amount: number;
}

interface BalanceEntry {
  id: number;
  amount: number;
}

// --- データストア ---
let members: Member[] = [];
let expenses: Expense[] = [];
let nextMemberId: number = 0;
let nextExpenseId: number = 0;

// --- DOM要素 ---
const memberNameInput = document.getElementById('memberName') as HTMLInputElement;
const membersListDiv = document.getElementById('membersList') as HTMLDivElement;
const memberErrorDiv = document.getElementById('memberError') as HTMLDivElement;
const paidBySelect = document.getElementById('paidBy') as HTMLSelectElement;
const paidForCheckboxesDiv = document.getElementById('paidForCheckboxes') as HTMLDivElement;
const expensesLogDiv = document.getElementById('expensesLog') as HTMLDivElement;
const settlementResultDiv = document.getElementById('settlementResult') as HTMLDivElement;
const addExpenseForm = document.getElementById('addExpenseForm') as HTMLDivElement;
const expenseWarning = document.getElementById('expenseWarning') as HTMLDivElement;
const expenseErrorDiv = document.getElementById('expenseError') as HTMLDivElement;
const expenseDescriptionInput = document.getElementById('expenseDescription') as HTMLInputElement;
const expenseAmountInput = document.getElementById('expenseAmount') as HTMLInputElement;
const expenseDateInput = document.getElementById('expenseDate') as HTMLInputElement;

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
    expenseDateInput.valueAsDate = new Date();
});

// --- メンバー関連の関数 ---

function addMember(): void {
    memberErrorDiv.textContent = ''; // エラーメッセージをリセット
    const name = memberNameInput.value.trim();
    if (name === "") {
        memberErrorDiv.textContent = "メンバー名を入力してください。";
        return;
    }
    if (members.find(m => m.name === name)) {
        memberErrorDiv.textContent = "同じ名前のメンバーが既に存在します。";
        return;
    }

    members.push({ id: nextMemberId++, name: name });
    memberNameInput.value = "";
    render();
}

function removeMember(id: number): void {
    members = members.filter(m => m.id !== id);
    // メンバーが関与する支払いを削除
    expenses = expenses.filter(expense => {
        const isPayer = expense.paidById === id;
        const isIncluded = expense.paidForIds.includes(id);
        return !isPayer && !isIncluded;
    });
    render();
}

// --- 支払い関連の関数 ---

function addExpense(): void {
    expenseErrorDiv.textContent = ''; // エラーメッセージをリセット
    const description = expenseDescriptionInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const date = expenseDateInput.value;
    const paidById = parseInt(paidBySelect.value);

    const paidForCheckboxes = document.querySelectorAll('#paidForCheckboxes input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
    const paidForIds = Array.from(paidForCheckboxes).map(cb => parseInt(cb.value));

    // バリデーション
    if (!description || !amount || !date || isNaN(paidById) || paidForIds.length === 0) {
        expenseErrorDiv.textContent = "すべての項目を正しく入力してください。";
        setTimeout(() => { expenseErrorDiv.textContent = '' }, 3000);
        return;
    }
    if (amount <= 0) {
        expenseErrorDiv.textContent = "金額は0より大きい値を入力してください。";
        setTimeout(() => { expenseErrorDiv.textContent = '' }, 3000);
        return;
    }

    expenses.push({
        id: nextExpenseId++,
        description,
        amount,
        date,
        paidById,
        paidForIds
    });

    // 入力フォームをリセット
    expenseDescriptionInput.value = "";
    expenseAmountInput.value = "";
    expenseDateInput.valueAsDate = new Date();
    paidBySelect.selectedIndex = 0;
    document.querySelectorAll('#paidForCheckboxes input[type="checkbox"]').forEach((cb: HTMLInputElement) => cb.checked = true);

    render();
}

function removeExpense(id: number): void {
    expenses = expenses.filter(e => e.id !== id);
    render();
}

// --- 再描画（レンダー）関連の関数 ---

function render(): void {
    renderMembers();
    renderExpenseForm();
    renderExpensesLog();
    calculateAndRenderSettlement();
}

function renderMembers(): void {
    membersListDiv.innerHTML = "";
    if (members.length === 0) {
        membersListDiv.innerHTML = `<p class="text-gray-500">まだメンバーがいません。</p>`;
    } else {
        members.forEach(member => {
            const memberTag = document.createElement('div');
            memberTag.className = 'flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1.5 rounded-full';
            memberTag.innerHTML = `
                    <span>${member.name}</span>
                    <button onclick="removeMember(${member.id})" class="ml-2 text-indigo-500 hover:text-indigo-700 focus:outline-none">&times;</button>
                `;
            membersListDiv.appendChild(memberTag);
        });
    }
}

function renderExpenseForm(): void {
    if (members.length < 2) {
        addExpenseForm.classList.add('hidden');
        expenseWarning.classList.remove('hidden');
    } else {
        addExpenseForm.classList.remove('hidden');
        expenseWarning.classList.add('hidden');

        // 支払者プルダウンを更新
        paidBySelect.innerHTML = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

        // 対象者チェックボックスを更新
        paidForCheckboxesDiv.innerHTML = members.map(m => `
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" value="${m.id}" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked>
                    <span>${m.name}</span>
                </label>
            `).join('');
    }
}

function renderExpensesLog(): void {
    expensesLogDiv.innerHTML = "";
    if (expenses.length === 0) {
        expensesLogDiv.innerHTML = '<p class="text-gray-500">まだ支払いはありません。</p>';
        return;
    }

    // 日付の降順でソート
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedExpenses.forEach(expense => {
        const payer = members.find(m => m.id === expense.paidById);
        if (!payer) return; // メンバーが削除された場合

        const paidForNames = expense.paidForIds
            .map(id => members.find(m => m.id === id)?.name)
            .filter((name): name is string => name !== undefined) // 削除されたメンバーを除外
            .join(', ');

        const expenseCard = document.createElement('div');
        expenseCard.className = 'p-3 border rounded-lg bg-gray-50 relative';
        expenseCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-800">${expense.description}</p>
                        <p class="text-sm text-gray-600">${payer.name}が <strong class="text-lg text-indigo-600">${expense.amount.toLocaleString()}円</strong> 支払いました</p>
                        <p class="text-xs text-gray-500 mt-1">${expense.date} / 対象: ${paidForNames}</p>
                    </div>
                    <button onclick="removeExpense(${expense.id})" class="text-gray-400 hover:text-red-500 text-lg">&times;</button>
                </div>
            `;
        expensesLogDiv.appendChild(expenseCard);
    });
}

// --- 精算ロジック ---

function calculateAndRenderSettlement(): void {
    if (expenses.length === 0 || members.length < 2) {
        settlementResultDiv.innerHTML = '<p class="text-indigo-700">支払いが追加されると、ここに精算結果が表示されます。</p>';
        return;
    }

    const balances = new Map<number, number>();
    members.forEach(member => balances.set(member.id, 0));

    // 各人の貸し借りを計算
    expenses.forEach(expense => {
        const payerId = expense.paidById;
        const amount = expense.amount;
        const paidForIds = expense.paidForIds;
        const share = amount / paidForIds.length;

        // 支払った人はプラス
        const currentBalance = balances.get(payerId) || 0;
        balances.set(payerId, currentBalance + amount);

        // 対象者はマイナス
        paidForIds.forEach(memberId => {
            if (balances.has(memberId)) {
                const currentMemberBalance = balances.get(memberId) || 0;
                balances.set(memberId, currentMemberBalance - share);
            }
        });
    });

    // 貸している人（プラス）と借りている人（マイナス）に分ける
    const creditors: BalanceEntry[] = []; // 貸してる人
    const debtors: BalanceEntry[] = []; // 借りてる人

    balances.forEach((amount, memberId) => {
        if (amount > 0.01) { // 浮動小数点誤差を考慮
            creditors.push({ id: memberId, amount: amount });
        } else if (amount < -0.01) {
            debtors.push({ id: memberId, amount: -amount });
        }
    });

    const transactions: Transaction[] = [];

    // 精算取引を生成
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const transferAmount = Math.min(debtor.amount, creditor.amount);

        if (transferAmount > 0.01) {
            transactions.push({
                from: debtor.id,
                to: creditor.id,
                amount: transferAmount
            });

            debtor.amount -= transferAmount;
            creditor.amount -= transferAmount;
        }

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    // 結果を描画
    renderSettlement(transactions);
}

function renderSettlement(transactions: Transaction[]): void {
    settlementResultDiv.innerHTML = "";
    if (transactions.length === 0) {
        settlementResultDiv.innerHTML = '<p class="font-semibold text-green-600">🎉 全員の精算は完了しています！</p>';
        return;
    }

    transactions.forEach(tx => {
        const fromMember = members.find(m => m.id === tx.from);
        const toMember = members.find(m => m.id === tx.to);

        if (!fromMember || !toMember) return;

        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'flex items-center justify-between bg-white p-3 rounded-lg shadow-sm';
        transactionDiv.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="font-semibold text-gray-700">${fromMember.name}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                    <span class="font-semibold text-gray-700">${toMember.name}</span>
                </div>
                <div class="font-bold text-lg text-indigo-600">${Math.round(tx.amount).toLocaleString()}円</div>
            `;
        settlementResultDiv.appendChild(transactionDiv);
    });
}

// グローバル関数として公開（HTMLから呼び出し用）
(window as any).addMember = addMember;
(window as any).removeMember = removeMember;
(window as any).addExpense = addExpense;
(window as any).removeExpense = removeExpense;

// --- 初期描画 ---
render();