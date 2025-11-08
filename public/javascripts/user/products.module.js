class Product {
    constructor() {
        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    init() {
        this.cacheElements();
        this.bindEvents();

        this.currentCategory = 'all';
        this.currentSort = null; // 'asc' | 'desc' | null
        this.loadProducts(this.currentCategory, this.currentSort);
    }

    cacheElements() {
        this.categoryBtns = document.querySelectorAll('.category-btn');
        this.productList = document.querySelector('.product-list');
        this.sortBtns = document.querySelectorAll('.sort-btn');
    }


    bindEvents() {
        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Xoá active của nút khác, set active cho nút hiện tại
                this.categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Lấy categoryId
                const categoryId = btn.dataset.category;
                this.loadProducts(categoryId);
            });
        });

        this.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.sortBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.currentSort = btn.dataset.sort; // 'asc' hoặc 'desc'
                this.loadProducts(this.currentCategory, this.currentSort);
            });
        });

    }
    async loadProducts(categoryId, sortOrder = null) {
        try {
            const res = await fetch(`/api/products/category/${categoryId}`);
            const data = await res.json();

            if (res.ok) {
                let products = data.data;

                // Sắp xếp giá nếu có sortOrder
                if (sortOrder === 'asc') {
                    products.sort((a, b) => a.price - b.price);
                } else if (sortOrder === 'desc') {
                    products.sort((a, b) => b.price - a.price);
                }

                this.renderProducts(products);
            } else {
                console.error('Lỗi API:', data.message);
            }
        } catch (err) {
            console.error('Lỗi fetch:', err);
        }
    }

    renderProducts(products) {
        // Clear trước khi đổ dữ liệu
        this.productList.innerHTML = '';

        if (!products || products.length === 0) {
            this.productList.innerHTML = '<p>Không có sản phẩm nào</p>';
            return;
        }

        // Tạo HTML sản phẩm
        const html = products.map(p => `
            <a href="/products/${p._id}" class="product-item">
                <img src="${p.images?.[0] || '/images/default.png'}" alt="${p.name}">
                <h4 class="product-name">${p.name}</h4>
                <p class="product-price">${this.formatCurrency(p.price)}</p>
            </a>
        `).join('');

        this.productList.innerHTML = html;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }
}

export default new Product();
