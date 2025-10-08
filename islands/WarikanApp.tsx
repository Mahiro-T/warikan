import { useEffect, useState } from "preact/hooks";

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

interface DetailedTransaction {
  expenseId: number;
  expenseDescription: string;
  expenseDate: string;
  from: number;
  to: number;
  amount: number;
}

type SettlementMode = "optimized" | "detailed";

interface AggregatedTransaction {
  from: number;
  to: number;
  totalAmount: number;
  details: DetailedTransaction[];
}

export default function WarikanApp() {
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [nextMemberId, setNextMemberId] = useState(0);
  const [nextExpenseId, setNextExpenseId] = useState(0);
  const [memberName, setMemberName] = useState("");
  const [memberError, setMemberError] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [paidById, setPaidById] = useState(0);
  const [paidForIds, setPaidForIds] = useState<number[]>([]);
  const [expenseError, setExpenseError] = useState("");
  const [settlementMode, setSettlementMode] = useState<SettlementMode>("optimized");
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setExpenseDate(today);
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      setPaidById(members[0].id);
      setPaidForIds(members.map((m) => m.id));
    }
  }, [members]);

  const addMember = () => {
    setMemberError("");
    const name = memberName.trim();
    if (name === "") {
      setMemberError("メンバー名を入力してください。");
      return;
    }
    if (members.find((m) => m.name === name)) {
      setMemberError("同じ名前のメンバーが既に存在します。");
      return;
    }

    setMembers([...members, { id: nextMemberId, name }]);
    setNextMemberId(nextMemberId + 1);
    setMemberName("");
  };

  const removeMember = (id: number) => {
    setMembers(members.filter((m) => m.id !== id));
    setExpenses(
      expenses.filter((expense) => {
        const isPayer = expense.paidById === id;
        const isIncluded = expense.paidForIds.includes(id);
        return !isPayer && !isIncluded;
      })
    );
  };

  const addExpense = () => {
    setExpenseError("");
    const description = expenseDescription.trim();
    const amount = parseFloat(expenseAmount);
    const date = expenseDate;

    if (!description || !amount || !date || isNaN(paidById) || paidForIds.length === 0) {
      setExpenseError("すべての項目を正しく入力してください。");
      setTimeout(() => setExpenseError(""), 3000);
      return;
    }
    if (amount <= 0) {
      setExpenseError("金額は0より大きい値を入力してください。");
      setTimeout(() => setExpenseError(""), 3000);
      return;
    }

    setExpenses([
      ...expenses,
      {
        id: nextExpenseId,
        description,
        amount,
        date,
        paidById,
        paidForIds: [...paidForIds],
      },
    ]);
    setNextExpenseId(nextExpenseId + 1);

    setExpenseDescription("");
    setExpenseAmount("");
    const today = new Date().toISOString().split("T")[0];
    setExpenseDate(today);
    if (members.length > 0) {
      setPaidById(members[0].id);
      setPaidForIds(members.map((m) => m.id));
    }
  };

  const removeExpense = (id: number) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const togglePaidFor = (memberId: number) => {
    if (paidForIds.includes(memberId)) {
      setPaidForIds(paidForIds.filter((id) => id !== memberId));
    } else {
      setPaidForIds([...paidForIds, memberId]);
    }
  };

  const calculateDetailedSettlement = (): DetailedTransaction[] => {
    const detailedTransactions: DetailedTransaction[] = [];

    expenses.forEach((expense) => {
      const payerId = expense.paidById;
      const amount = expense.amount;
      const paidForIds = expense.paidForIds;
      const share = amount / paidForIds.length;

      // 支払った人以外の、割り勘対象者が支払うべき金額を計算
      paidForIds.forEach((memberId) => {
        if (memberId !== payerId) {
          detailedTransactions.push({
            expenseId: expense.id,
            expenseDescription: expense.description,
            expenseDate: expense.date,
            from: memberId,
            to: payerId,
            amount: share,
          });
        }
      });
    });

    // 日付順にソート（新しい順）
    return detailedTransactions.sort(
      (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    );
  };

  const aggregateDetailedTransactions = (detailedTransactions: DetailedTransaction[]): AggregatedTransaction[] => {
    const aggregated = new Map<string, AggregatedTransaction>();

    detailedTransactions.forEach((dtx) => {
      const key = `${dtx.from}-${dtx.to}`;
      
      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.totalAmount += dtx.amount;
        existing.details.push(dtx);
      } else {
        aggregated.set(key, {
          from: dtx.from,
          to: dtx.to,
          totalAmount: dtx.amount,
          details: [dtx],
        });
      }
    });

    return Array.from(aggregated.values());
  };

  const toggleTransactionDetails = (fromId: number, toId: number) => {
    const key = `${fromId}-${toId}`;
    const newExpanded = new Set(expandedTransactions);
    
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    
    setExpandedTransactions(newExpanded);
  };

  const calculateSettlement = (): Transaction[] => {
    if (expenses.length === 0 || members.length < 2) {
      return [];
    }

    const balances = new Map<number, number>();
    members.forEach((member) => balances.set(member.id, 0));

    expenses.forEach((expense) => {
      const payerId = expense.paidById;
      const amount = expense.amount;
      const paidForIds = expense.paidForIds;
      const share = amount / paidForIds.length;

      const currentBalance = balances.get(payerId) || 0;
      balances.set(payerId, currentBalance + amount);

      paidForIds.forEach((memberId) => {
        if (balances.has(memberId)) {
          const currentMemberBalance = balances.get(memberId) || 0;
          balances.set(memberId, currentMemberBalance - share);
        }
      });
    });

    const creditors: BalanceEntry[] = [];
    const debtors: BalanceEntry[] = [];

    balances.forEach((amount, memberId) => {
      if (amount > 0.01) {
        creditors.push({ id: memberId, amount: amount });
      } else if (amount < -0.01) {
        debtors.push({ id: memberId, amount: -amount });
      }
    });

    const transactions: Transaction[] = [];

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const transferAmount = Math.min(debtor.amount, creditor.amount);

      if (transferAmount > 0.01) {
        transactions.push({
          from: debtor.id,
          to: creditor.id,
          amount: transferAmount,
        });

        debtor.amount -= transferAmount;
        creditor.amount -= transferAmount;
      }

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return transactions;
  };

  const transactions = calculateSettlement();
  const detailedTransactions = calculateDetailedSettlement();
  const aggregatedTransactions = aggregateDetailedTransactions(detailedTransactions);
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div class="container mx-auto p-4 md:p-8 max-w-4xl">
      <header class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900">旅行割り勘精算アプリ</h1>
        <p class="text-gray-600 mt-2">
          メンバーと支払いを追加して、簡単に精算しましょう。
        </p>
      </header>

      <main id="app">
        {/* メンバー管理セクション */}
        <div class="card">
          <h2 class="text-2xl font-semibold mb-4 text-gray-900">
            1. メンバーを追加
          </h2>
          {memberError && (
            <div class="text-red-500 text-sm mb-2 -mt-2">{memberError}</div>
          )}
          <div class="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={memberName}
              onInput={(e) => setMemberName((e.target as HTMLInputElement).value)}
              onKeyPress={(e) => e.key === "Enter" && addMember()}
              class="input-field flex-grow"
              placeholder="例: やまだ"
            />
            <button onClick={addMember} class="btn btn-primary">
              メンバーを追加
            </button>
          </div>
          <div class="mt-4 flex flex-wrap gap-3">
            {members.length === 0 ? (
              <p class="text-gray-500">まだメンバーがいません。</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  class="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1.5 rounded-full"
                >
                  <span>{member.name}</span>
                  <button
                    onClick={() => removeMember(member.id)}
                    class="ml-2 text-indigo-500 hover:text-indigo-700 focus:outline-none"
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 支払い追加セクション */}
        <div class="card">
          <h2 class="text-2xl font-semibold mb-4 text-gray-900">
            2. 支払いを追加
          </h2>
          {expenseError && (
            <div class="text-red-500 text-sm mb-4 -mt-2">{expenseError}</div>
          )}
          {members.length < 2 ? (
            <div class="text-center text-gray-500">
              <p>まずメンバーを2人以上追加してください。</p>
            </div>
          ) : (
            <div class="space-y-4">
              <div>
                <label for="expenseDescription" class="label">
                  内容
                </label>
                <input
                  type="text"
                  id="expenseDescription"
                  value={expenseDescription}
                  onInput={(e) =>
                    setExpenseDescription((e.target as HTMLInputElement).value)}
                  class="input-field"
                  placeholder="例: 昼食代"
                />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label for="expenseAmount" class="label">
                    金額 (円)
                  </label>
                  <input
                    type="number"
                    id="expenseAmount"
                    value={expenseAmount}
                    onInput={(e) =>
                      setExpenseAmount((e.target as HTMLInputElement).value)}
                    class="input-field"
                    placeholder="例: 3000"
                  />
                </div>
                <div>
                  <label for="expenseDate" class="label">
                    日付
                  </label>
                  <input
                    type="date"
                    id="expenseDate"
                    value={expenseDate}
                    onInput={(e) =>
                      setExpenseDate((e.target as HTMLInputElement).value)}
                    class="input-field"
                  />
                </div>
                <div>
                  <label for="paidBy" class="label">
                    支払った人
                  </label>
                  <select
                    id="paidBy"
                    value={paidById}
                    onChange={(e) =>
                      setPaidById(parseInt((e.target as HTMLSelectElement).value))}
                    class="input-field"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label class="label">誰の分？ (複数選択可)</label>
                <div class="mt-2 p-4 border border-gray-200 rounded-lg grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {members.map((m) => (
                    <label
                      key={m.id}
                      class="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={paidForIds.includes(m.id)}
                        onChange={() => togglePaidFor(m.id)}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div class="text-right">
                <button onClick={addExpense} class="btn btn-primary">
                  支払いを追加
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 支払い履歴と精算結果 */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 支払い履歴 */}
          <div class="card">
            <h2 class="text-2xl font-semibold mb-4 text-gray-900">支払い履歴</h2>
            <div class="space-y-3">
              {sortedExpenses.length === 0 ? (
                <p class="text-gray-500">まだ支払いはありません。</p>
              ) : (
                sortedExpenses.map((expense) => {
                  const payer = members.find((m) => m.id === expense.paidById);
                  if (!payer) return null;

                  const paidForNames = expense.paidForIds
                    .map((id) => members.find((m) => m.id === id)?.name)
                    .filter((name): name is string => name !== undefined)
                    .join(", ");

                  return (
                    <div
                      key={expense.id}
                      class="p-3 border rounded-lg bg-gray-50 relative"
                    >
                      <div class="flex justify-between items-start">
                        <div>
                          <p class="font-semibold text-gray-800">
                            {expense.description}
                          </p>
                          <p class="text-sm text-gray-600">
                            {payer.name}が{" "}
                            <strong class="text-lg text-indigo-600">
                              {expense.amount.toLocaleString()}円
                            </strong>{" "}
                            支払いました
                          </p>
                          <p class="text-xs text-gray-500 mt-1">
                            {expense.date} / 対象: {paidForNames}
                          </p>
                        </div>
                        <button
                          onClick={() => removeExpense(expense.id)}
                          class="text-gray-400 hover:text-red-500 text-lg"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 精算結果 */}
          <div class="card bg-indigo-50">
            <h2 class="text-2xl font-semibold mb-4 text-indigo-900">
              3. 精算結果
            </h2>
            
            {/* 精算モード選択 */}
            {expenses.length > 0 && members.length >= 2 && (
              <div class="mb-4 flex gap-2 bg-white p-2 rounded-lg">
                <button
                  onClick={() => setSettlementMode("optimized")}
                  class={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    settlementMode === "optimized"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  最適化モード
                </button>
                <button
                  onClick={() => setSettlementMode("detailed")}
                  class={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    settlementMode === "detailed"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ガチガチ計算モード
                </button>
              </div>
            )}

            <div class="space-y-3">
              {expenses.length === 0 || members.length < 2 ? (
                <p class="text-indigo-700">
                  支払いが追加されると、ここに精算結果が表示されます。
                </p>
              ) : settlementMode === "optimized" ? (
                // 最適化モード
                transactions.length === 0 ? (
                  <p class="font-semibold text-green-600">
                    🎉 全員の精算は完了しています！
                  </p>
                ) : (
                  <>
                    <p class="text-sm text-indigo-600 mb-3">
                      💡 取引回数を最小化した精算方法
                    </p>
                    {transactions.map((tx, idx) => {
                      const fromMember = members.find((m) => m.id === tx.from);
                      const toMember = members.find((m) => m.id === tx.to);

                      if (!fromMember || !toMember) return null;

                      return (
                        <div
                          key={idx}
                          class="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                        >
                          <div class="flex items-center gap-3">
                            <span class="font-semibold text-gray-700">
                              {fromMember.name}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                clip-rule="evenodd"
                              />
                            </svg>
                            <span class="font-semibold text-gray-700">
                              {toMember.name}
                            </span>
                          </div>
                          <div class="font-bold text-lg text-indigo-600">
                            {Math.round(tx.amount).toLocaleString()}円
                          </div>
                        </div>
                      );
                    })}
                  </>
                )
              ) : (
                // ガチガチ計算モード
                <>
                  <p class="text-sm text-indigo-600 mb-3">
                    📋 各支払いごとの都度払い精算（クリックで詳細表示）
                  </p>
                  {aggregatedTransactions.length === 0 ? (
                    <p class="font-semibold text-green-600">
                      🎉 全員の精算は完了しています！
                    </p>
                  ) : (
                    <div class="space-y-3">
                      {aggregatedTransactions.map((aggTx) => {
                        const fromMember = members.find((m) => m.id === aggTx.from);
                        const toMember = members.find((m) => m.id === aggTx.to);
                        const key = `${aggTx.from}-${aggTx.to}`;
                        const isExpanded = expandedTransactions.has(key);

                        if (!fromMember || !toMember) return null;

                        return (
                          <div key={key} class="bg-white rounded-lg shadow-sm overflow-hidden">
                            <button
                              onClick={() => toggleTransactionDetails(aggTx.from, aggTx.to)}
                              class="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <div class="flex items-center gap-3">
                                <span class="font-semibold text-gray-700">
                                  {fromMember.name}
                                </span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  class="h-5 w-5 text-gray-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fill-rule="evenodd"
                                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                    clip-rule="evenodd"
                                  />
                                </svg>
                                <span class="font-semibold text-gray-700">
                                  {toMember.name}
                                </span>
                              </div>
                              <div class="flex items-center gap-2">
                                <div class="font-bold text-lg text-indigo-600">
                                  {Math.round(aggTx.totalAmount).toLocaleString()}円
                                </div>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  class={`h-5 w-5 text-gray-400 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fill-rule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clip-rule="evenodd"
                                  />
                                </svg>
                              </div>
                            </button>
                            
                            {isExpanded && (
                              <div class="border-t border-gray-200 bg-gray-50 p-3">
                                <div class="text-xs font-semibold text-gray-500 mb-2">内訳:</div>
                                <div class="space-y-2">
                                  {aggTx.details.map((detail, idx) => (
                                    <div
                                      key={idx}
                                      class="flex justify-between items-start text-sm bg-white p-2 rounded"
                                    >
                                      <div>
                                        <div class="font-medium text-gray-700">
                                          {detail.expenseDescription}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                          {detail.expenseDate}
                                        </div>
                                      </div>
                                      <div class="font-semibold text-indigo-600">
                                        {Math.round(detail.amount).toLocaleString()}円
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer class="text-center mt-12 text-gray-500">
        <p>&copy; 2025 Mahiro. All rights reserved.</p>
      </footer>
    </div>
  );
}
