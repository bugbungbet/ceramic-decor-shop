import Switch from "./components/switch.js";
import Select from "./components/select.js";

class StockEntries {
    constructor() {
        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    init() {
        this.cacheElements();
        this.applyAnimationDelay("[class*='animate-']", 0.1);
        this.bindEvents();
    }

    cacheElements() {
        this.addStockEntryBtn = document.querySelector('.add-stockEntry-btn');
        this.formAddStockEntry = document.getElementById('formAddStockEntry');
        this.formEditStockEntry = document.getElementById('formEditStockEntry');
    }

    applyAnimationDelay(selector, step = 0.1) {
        const items = document.querySelectorAll(selector);

        items.forEach((el, index) => {
            const delay = index * step;
            el.style.animationDelay = `${delay}s`;
        });
    }

    bindEvents() {
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-wrapper');
                modal.classList.remove('show');
            });
        });

        if (this.addStockEntryBtn) {
            this.addStockEntryBtn.addEventListener('click', () => {
                this.openModal('modalAddStockEntry');
            });
        }

        this.formAddStockEntry?.addEventListener('submit', e => this.handleAdd(e));

        this.formEditStockEntry?.addEventListener('submit', e => this.handleEdit(e));

        this.bindDeleteButtons();

        this.bindEditButtons();

        document.querySelectorAll('.switch').forEach((s) => {
            new Switch(s, {
                onEnable: async () => {
                    const confirmed = await showConfirm("Bạn có chắc chắn muốn thay đổi trạng thái sản phẩm này không?");
                    if (!confirmed) return false;
                    return await this.updateStockEntryState(s, true); // true = enable
                },
                onDisable: async () => {
                    const confirmed = await showConfirm("Bạn có chắc chắn muốn thay đổi trạng thái sản phẩm này không?");
                    if (!confirmed) return false;
                    return await this.updateStockEntryState(s, false); // false = disable
                }
            });
        });

        document.querySelectorAll('.custom-select').forEach((el) => {
            const select = new Select(el, {
                onChange: async (newVal, oldVal) => {
                    if (oldVal === 'sold_out') return false;

                    const confirmed = await showConfirm(
                        `Bạn có chắc chắn muốn chuyển trạng thái từ "${oldVal}" sang "${newVal}" không?`
                    );
                    if (!confirmed) return false;

                    const stockId = el.id.replace('stockSelect_', '');
                    try {
                        const res = await fetch(`/api/stock-entries/${stockId}/update-status`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                newStatus: newVal,
                                reason: `Chuyển từ ${oldVal} sang ${newVal}`,
                            }),
                        });

                        const result = await res.json();

                        if (!res.ok) {
                            showToast(result.message || "Lỗi cập nhật trạng thái", "error");
                            return false;
                        }

                        const { updatedStatus, nextOptions } = result.data;

                        select.setValue(updatedStatus);

                        el.querySelector('.cs-trigger').classList.remove(oldVal)
                        el.querySelector('.cs-trigger').classList.add(newVal)

                        const translateMap = {
                            draft: 'Nháp',
                            imported: 'Đã nhập kho',
                            cancelled: 'Đã hủy/Tạm dừng',
                            discontinued: 'Ngừng bán'
                        };
                        const newItems = [
                            { value: updatedStatus, label: translateMap[updatedStatus] || updatedStatus },
                            ...nextOptions.map(st => ({
                                value: st,
                                label: translateMap[st] || st
                            }))
                        ];

                        select.setOptions(newItems);

                        const td = el.closest('td');
                        const tr = td?.closest('tr');
                        const actionGroup = tr?.querySelector('.action-group');
                        const editBtn = actionGroup?.querySelector('.edit-btn');
                        const deleteBtn = actionGroup?.querySelector('.delete-btn');

                        if (['draft'].includes(updatedStatus)) {
                            editBtn?.classList.remove('disabled');
                            deleteBtn?.classList.remove('disabled');
                        } else {
                            editBtn?.classList.add('disabled');
                            deleteBtn?.classList.add('disabled');
                        }

                        return true;
                    } catch (err) {
                        console.error(err);
                        alert('Lỗi khi gọi API');
                        return false;
                    }
                }
            });
        });

        document.querySelector('.btn-back').addEventListener('click', function (e) {
            e.preventDefault();

            if (document.referrer) {
                window.history.back();
            } else {
                window.location.href = '/admin/products';
            }
        });
    }
    handleImagePreview(e, previewContainer) {
        const files = e.target.files;
        previewContainer.innerHTML = '';

        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }

    async updateStockEntryState(el) {
        const id = el.dataset.id;

        try {
            showLoading("Đang cập nhật trạng thái...");
            const res = await fetch(`/api/stock-entries/${id}/toggle`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" }
            });
            const result = await res.json();
            hideLoading();

            if (result.success) {
                showToast(result.message || "Cập nhật trạng thái thành công", "success");
                return true;
            } else {
                showToast(result.message || "Cập nhật trạng thái thất bại", "error");
                return false;
            }
        } catch (err) {
            hideLoading();
            showToast("Có lỗi xảy ra khi cập nhật trạng thái", "error");
            return false;
        }
    }

    async handleAdd(e) {
        e.preventDefault();
        const confirmed = await showConfirm("Bạn có chắc chắn muốn thêm sản phẩm này không?");
        if (!confirmed) return;

        const formData = new FormData(this.formAddStockEntry);

        try {
            showLoading("Đang thêm sản phẩm...");
            const res = await fetch('/api/stock-entries/add', { method: 'POST', body: formData });
            const result = await res.json();
            hideLoading();

            if (result.success) {
                sessionStorage.setItem('sessionToast', JSON.stringify({
                    message: result.message,
                    type: 'success'
                }));
                window.location.reload();
            } else {
                showToast(result.message || "Thêm sản phẩm thất bại", "error");
            }
        } catch (err) {
            hideLoading();
            showToast("Có lỗi xảy ra khi thêm sản phẩm", "error");
        }
    }

    async bindEditButtons() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.closest('tr').querySelector('.delete-btn')?.dataset.id;
                if (!id) return;
                try {
                    showLoading("Đang tải dữ liệu...");
                    const res = await fetch(`/api/stock-entries/${id}`);
                    const result = await res.json();
                    hideLoading();

                    if (result.success) {
                        const StockEntry = result.data;
                        this.fillEditForm(StockEntry);
                        this.openModal('modalEditStockEntry');
                    } else {
                        showToast(result.message || "Không lấy được dữ liệu sản phẩm", "error");
                    }
                } catch (err) {
                    hideLoading();
                    showToast("Có lỗi xảy ra khi tải sản phẩm", "error");
                }
            });
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
    }

    bindDeleteButtons() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const confirmed = await showConfirm("Bạn có chắc chắn muốn xóa sản phẩm này?");
                if (!confirmed) return;

                try {
                    showLoading("Đang xóa sản phẩm...");
                    const res = await fetch(`/api/stock-entries/delete/${id}`, { method: 'DELETE' });
                    const result = await res.json();
                    hideLoading();

                    if (result.success) {
                        sessionStorage.setItem('sessionToast', JSON.stringify({
                            message: result.message,
                            type: 'success'
                        }));

                        window.location.reload();
                    } else {
                        showToast(result.message || "Xóa thất bại", "error");
                    }
                } catch (err) {
                    hideLoading();
                    showToast("Có lỗi xảy ra khi xóa", "error");
                }
            });
        });
    }

    fillEditForm(stockEntry) {
        if (!stockEntry) return;
        console.log(stockEntry);
        const form = this.formEditStockEntry;
        form.querySelector('#editStockEntryId').value = stockEntry._id || '';
        form.querySelector('#editProductId').value = stockEntry.productId || '';
        form.querySelector('#editBatchCode').value = stockEntry.batchCode || '';
        form.querySelector('#editImportPrice').value = stockEntry.importPrice || 0;
        form.querySelector('#editQuantity').value = stockEntry.quantity || '';
        form.querySelector('#editNote').value = stockEntry.note || '';
    }


    async handleEdit(e) {
        e.preventDefault();
        const confirmed = await showConfirm("Bạn có chắc chắn muốn cập nhật sản phẩm này không?");
        if (!confirmed) return;

        const formData = new FormData(this.formEditStockEntry);
        const id = formData.get('id');
        try {
            showLoading("Đang cập nhật sản phẩm...");
            const res = await fetch(`/api/stock-entries/edit/${id}`, { method: 'PUT', body: formData });
            const result = await res.json();
            hideLoading();

            if (result.success) {
                sessionStorage.setItem('sessionToast', JSON.stringify({
                    message: result.message,
                    type: 'success'
                }));
                window.location.reload();
            } else {
                showToast(result.message || "Cập nhật thất bại", "error");
            }
        } catch (err) {
            hideLoading();
            showToast("Có lỗi xảy ra khi cập nhật sản phẩm", "error");
        }
    }
}

export default new StockEntries();
