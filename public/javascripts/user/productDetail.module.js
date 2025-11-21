class Product {
    constructor() {
        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    init() {
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.mainImage = document.getElementById("mainProductImage");
        this.thumbnails = document.querySelectorAll(".thumbnail-images .thumbnail");

        // Quantity elements
        this.qtyInput = document.getElementById("productQty");
        this.btnIncrease = document.getElementById("increaseQty");
        this.btnDecrease = document.getElementById("decreaseQty");

        // Add to cart button
        this.btnAddToCart = document.getElementById("addToCart");
        this.btnBuyNow = document.getElementById("buyNow");

        if (this.btnAddToCart) {
            this.productId = this.btnAddToCart.dataset.id;      // data-id
            this.price = parseFloat(this.btnAddToCart.dataset.price) || 0; // data-price
        }
    }


    bindEvents() {

        if (!this.thumbnails.length || !this.mainImage) return;

        // Gắn active cho ảnh đầu tiên
        this.thumbnails[0].classList.add("active");

        this.thumbnails.forEach((thumb) => {
            thumb.addEventListener("click", () => this.handleThumbnailClick(thumb));
        });

        // Tăng giảm số lượng
        if (this.btnIncrease && this.btnDecrease && this.qtyInput) {
            this.btnIncrease.addEventListener("click", () => this.changeQuantity(1));
            this.btnDecrease.addEventListener("click", () => this.changeQuantity(-1));
        }

        // Add to cart
        if (this.btnAddToCart) {
            this.btnAddToCart.addEventListener("click", () => this.addToCart());
        }
        if (this.btnBuyNow) {
            this.btnBuyNow.addEventListener("click", () => this.buyNow());
        }
    }
    handleThumbnailClick(thumb) {
        // Bỏ active cũ
        this.thumbnails.forEach((t) => t.classList.remove("active"));

        // Gắn active mới
        thumb.classList.add("active");

        // Đổi ảnh chính
        this.mainImage.src = thumb.src;

        // Tuỳ chọn: thêm hiệu ứng fade mượt hơn
        this.mainImage.classList.add("fade");
        setTimeout(() => this.mainImage.classList.remove("fade"), 200);
    }
    changeQuantity(delta) {
        let qty = parseInt(this.qtyInput.value) || 1;
        qty += delta;
        if (qty < 1) qty = 1;
        this.qtyInput.value = qty;
    }
    async addToCart() {
        const quantity = parseInt(this.qtyInput.value) || 1;
        if (!this.productId) return;

        try {
            showLoading("Đang thêm sản phẩm vào giỏ...");

            const res = await fetch("/api/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: this.productId, quantity, price: this.price })
            });

            const result = await res.json();
            hideLoading();

            if (res.ok && result.success) {
                showToast(result.message || "Đã thêm vào giỏ hàng!", "success");
                // document.dispatchEvent(new CustomEvent("cartUpdated", { detail: result }));
            } else {
                showToast(result.message || "Thêm giỏ hàng thất bại!", "error");
            }
        } catch (err) {
            hideLoading();
            console.error("Lỗi khi thêm vào giỏ hàng:", err);
            showToast("Có lỗi xảy ra khi thêm giỏ hàng!", "error");
        }
    }

    // async buyNow() {
    //     const quantity = parseInt(this.qtyInput.value) || 1;
    //     const productId = this.btnBuyNow.dataset.id;
    //     if (!productId) return;

    //     try {
    //         showLoading("Đang xử lý mua ngay...");

    //         const res = await fetch("/payment/buy-now", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({
    //                 productId: productId,
    //                 quantity
    //             })
    //         });

    //         hideLoading();

    //         // Nếu buy-now dùng res.render → server sẽ redirect
    //         // => ta kiểm tra nếu server redirect thì chuyển hướng theo
    //         // if (res.redirected) {
    //         //     window.location.href = res.url;
    //         //     return;
    //         // }

    //         const result = await res.json();

    //         if (res.ok && result.success) {
    //             // window.location.href = "/payment";
    //         } else {
    //             showToast(result.message || "Mua ngay thất bại!", "error");
    //         }

    //     } catch (err) {
    //         hideLoading();
    //         console.error("Lỗi khi mua ngay:", err);
    //         showToast("Có lỗi xảy ra khi xử lý mua ngay!", "error");
    //     }
    // }

    buyNow() {
        const quantity = parseInt(this.qtyInput.value) || 1;
        const productId = this.btnBuyNow.dataset.id;
        if (!productId) return;

        showLoading("Đang xử lý mua ngay...");

        // Tạo form POST
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/payment/buy-now";

        // Thêm input ẩn
        form.innerHTML = `
        <input type="hidden" name="productId" value="${productId}">
        <input type="hidden" name="quantity" value="${quantity}">
    `;

        document.body.appendChild(form);

        // Submit form → browser tự chuyển hướng
        form.submit();
    }


}

export default new Product();
