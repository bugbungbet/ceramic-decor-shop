import Switch from "./components/switch.js";

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

        // Xử lý preview ảnh (cho cả form thêm và form chỉnh sửa)
        const fileInputs = document.querySelectorAll('input[type="file"][data-preview]');
        fileInputs.forEach(input => {
            const previewSelector = input.getAttribute('data-preview');
            const previewContainer = document.querySelector(previewSelector);

            if (previewContainer) {
                input.addEventListener('change', (e) => this.handleImagePreview(e, previewContainer));
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

        // const form = this.formEditProduct;
        // form.querySelector('#editProductId').value = stockEntry._id || '';
        // form.querySelector('#editProductName').value = stockEntry.name || '';
        // form.querySelector('#editProductPrice').value = stockEntry.price || 0;
        // form.querySelector('#editProductCategory').value = stockEntry.categoryId._id || '';
        // form.querySelector('#editProductIntro').value = stockEntry.introduction || '';
        // form.querySelector('#editProductDetails').value = stockEntry.details || '';
        // form.querySelector('#editProductDisplaySuggestion').value = stockEntry.displaySuggestion || '';
        // form.querySelector('#editProductPreservationGuide').value = stockEntry.preservationGuide || '';


        // // --- Hiển thị preview ảnh ---
        // const previewContainer = form.querySelector('#previewEditProductImages');
        // previewContainer.innerHTML = ''; // clear cũ

        // if (stockEntry.images && stockEntry.images.length > 0) {
        //     stockEntry.images.forEach(imgUrl => {
        //         const img = document.createElement('img');
        //         img.src = imgUrl;
        //         img.alt = 'Ảnh sản phẩm';
        //         img.className = 'preview-image';
        //         previewContainer.appendChild(img);
        //     });
        // } else {
        //     previewContainer.innerHTML = '<p class="text-muted">Chưa có ảnh</p>';
        // }
    }


    async handleEdit(e) {
        e.preventDefault();
        const confirmed = await showConfirm("Bạn có chắc chắn muốn cập nhật sản phẩm này không?");
        if (!confirmed) return;

        const formData = new FormData(this.formEditStockEntry);
        const id = formData.get('id');
        const name = formData.get('name');
        console.log(name);
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
