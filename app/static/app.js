// === Tag Input Component ===
function initTagInput(wrapperId, hiddenInputId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const input = wrapper.querySelector('input[type="text"]');
    const hidden = document.getElementById(hiddenInputId);
    let tags = hidden.value ? hidden.value.split(',').filter(t => t.trim()) : [];

    function renderTags() {
        wrapper.querySelectorAll('.tag').forEach(t => t.remove());
        tags.forEach((tag, i) => {
            const span = document.createElement('span');
            span.className = 'tag removable';
            span.innerHTML = `${tag} <span class="remove" data-index="${i}">&times;</span>`;
            wrapper.insertBefore(span, input);
        });
        hidden.value = tags.join(',');
    }

    wrapper.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove')) {
            tags.splice(parseInt(e.target.dataset.index), 1);
            renderTags();
        } else {
            input.focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
            e.preventDefault();
            const val = input.value.trim().replace(/,/g, '');
            if (val && !tags.includes(val)) {
                tags.push(val);
                renderTags();
            }
            input.value = '';
        }
        if (e.key === 'Backspace' && !input.value && tags.length) {
            tags.pop();
            renderTags();
        }
    });

    // Autocomplete
    let sugBox = null;
    input.addEventListener('input', async () => {
        const q = input.value.trim();
        if (sugBox) { sugBox.remove(); sugBox = null; }
        if (q.length < 1) return;

        try {
            const res = await fetch(`/api/tags/suggest?q=${encodeURIComponent(q)}`);
            const suggestions = await res.json();
            if (suggestions.length === 0) return;

            sugBox = document.createElement('div');
            sugBox.className = 'tag-suggestions';
            suggestions.forEach(s => {
                const div = document.createElement('div');
                div.textContent = s;
                div.addEventListener('click', () => {
                    if (!tags.includes(s)) {
                        tags.push(s);
                        renderTags();
                    }
                    input.value = '';
                    sugBox.remove();
                    sugBox = null;
                });
                sugBox.appendChild(div);
            });
            wrapper.style.position = 'relative';
            wrapper.appendChild(sugBox);
        } catch (err) {}
    });

    document.addEventListener('click', (e) => {
        if (sugBox && !wrapper.contains(e.target)) {
            sugBox.remove();
            sugBox = null;
        }
    });

    renderTags();
}

// === Dynamic Role Rows ===
let roleCounter = 0;

function addRoleRow() {
    const container = document.getElementById('roles-container');
    if (!container) return;
    roleCounter++;
    const div = document.createElement('div');
    div.className = 'role-row';
    div.id = `role-row-${roleCounter}`;
    div.innerHTML = `
        <div class="role-header">
            <strong>身分 #${container.children.length + 1}</strong>
            <button type="button" class="btn-sm btn-danger" onclick="this.closest('.role-row').remove()">移除</button>
        </div>
        <div class="grid-2">
            <label>公司
                <select name="role_company_id[]">
                    <option value="">-- 選擇公司 --</option>
                    ${window.__companies ? window.__companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('') : ''}
                </select>
            </label>
            <label>職稱
                <input type="text" name="role_title[]" placeholder="例：CEO、顧問">
            </label>
        </div>
        <div class="grid-2">
            <label>工作 Email
                <input type="email" name="role_work_email[]" placeholder="work@company.com">
            </label>
            <label>工作電話
                <input type="text" name="role_work_phone[]" placeholder="02-1234-5678">
            </label>
        </div>
        <label>
            <input type="checkbox" name="role_is_current[]" value="${roleCounter}" checked>
            目前在職
        </label>
    `;
    container.appendChild(div);
}

// === Confirm Delete ===
function confirmDelete(form, name) {
    if (confirm(`確定要刪除「${name}」嗎？此操作無法復原。`)) {
        form.submit();
    }
}

// === Init on DOM ready ===
document.addEventListener('DOMContentLoaded', () => {
    initTagInput('tag-input-wrapper', 'tags-hidden');
});
