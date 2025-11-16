
class Orders {
    constructor() {
        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindReviewStars();
        this.bindReviewImages();
        this.bindSubmitReview();
    }

    cacheElements() {
        this.reviewModal = document.getElementById("reviewModal");
        this.reviewOverlay = this.reviewModal?.querySelector(".review-overlay");
        this.cancelReviewBtn = this.reviewModal?.querySelector("#reviewCancelBtn");
        this.submitReviewBtn = this.reviewModal?.querySelector("#reviewSubmitBtn");
        this.reviewStars = this.reviewModal?.querySelectorAll(".star-item");
        this.reviewImagesInput = this.reviewModal?.querySelector("#reviewImagesInput");
        this.reviewUploadBtn = this.reviewModal?.querySelector("#reviewUploadBtn");
        this.reviewImagesPreview = this.reviewModal?.querySelector(".review-images-preview");
        this.reviewTextarea = this.reviewModal?.querySelector("#reviewTextarea");
    }

    bindEvents() {
        document.querySelectorAll(".btn-cancel").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const orderId = e.target.dataset.id;
                if (!orderId) return;


                const confirmed = await showConfirm(
                    `Bạn có chắc chắn muốn huỷ đơn hàng này không?`
                );
                if (!confirmed) return false;

                try {
                    showLoading("Đang huỷ đơn hàng...");

                    const res = await fetch(`/api/orders/${orderId}/cancel`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" }
                    });

                    const result = await res.json();
                    hideLoading();

                    if (res.ok && result.success) {
                        showToast(result.message || "Huỷ đơn hàng thành công!", "success");
                        location.reload(); // reload để cập nhật danh sách đơn
                    } else {
                        showToast(result.message || "Không thể huỷ đơn hàng!", "error");
                    }

                } catch (err) {
                    hideLoading();
                    console.error("Lỗi khi huỷ đơn hàng:", err);
                    showToast("Có lỗi xảy ra, vui lòng thử lại sau!", "error");
                }
            });
        });


        // ==== Mở modal đánh giá ====
        document.querySelectorAll(".btn-review").forEach(btn => {
            btn.addEventListener("click", () => {
                const orderId = btn.dataset.orderId;
                const itemId = btn.dataset.itemId;
                const productId = btn.dataset.productId;

                if (!this.reviewModal) return;

                // Gắn data để dùng khi gửi đánh giá
                this.reviewModal.dataset.orderId = orderId;
                this.reviewModal.dataset.itemId = itemId;
                this.reviewModal.dataset.productId = productId;

                // Hiển thị modal
                this.reviewModal.classList.remove("d-none");
                document.body.style.overflow = "hidden";
            });
        });

        // ==== Đóng modal đánh giá ====
        if (this.reviewOverlay)
            this.reviewOverlay.addEventListener("click", () => this.closeReviewModal());
        if (this.cancelReviewBtn)
            this.cancelReviewBtn.addEventListener("click", () => this.closeReviewModal());
    }
    closeReviewModal() {
        if (!this.reviewModal) return;
        this.reviewModal.classList.add("d-none");
        document.body.style.overflow = "";
    }


    resetReviewForm() {
        // reset sao, textarea, ảnh
        this.selectedRating = 5;
        this.reviewStars.forEach(s => s.classList.remove("selected"));
        this.reviewStars[this.selectedRating - 1].classList.add("selected");

        this.reviewTextarea.value = "";
        this.reviewImagesPreview.innerHTML = "";
        this.reviewImagesInput.value = "";
    }

    bindReviewStars() {
        if (!this.reviewStars) return;
        this.selectedRating = 5; // mặc định

        // highlight mặc định
        this.highlightStars();

        this.reviewStars.forEach(star => {
            star.addEventListener("click", () => {
                this.selectedRating = parseInt(star.dataset.value);
                this.highlightStars();
            });
        });
    }

    highlightStars() {
        this.reviewStars.forEach(star => {
            const value = parseInt(star.dataset.value);
            if (value === this.selectedRating) {
                star.classList.add("selected");
            } else {
                star.classList.remove("selected");
            }
        });
    }


    // bindReviewImages() {
    //     if (!this.reviewUploadBtn || !this.reviewImagesInput) return;

    //     this.reviewUploadBtn.addEventListener("click", () => this.reviewImagesInput.click());

    //     this.reviewImagesInput.addEventListener("change", () => {
    //         this.reviewImagesPreview.innerHTML = "";
    //         const files = Array.from(this.reviewImagesInput.files);

    //         files.forEach(file => {
    //             const reader = new FileReader();
    //             reader.onload = e => {
    //                 const img = document.createElement("img");
    //                 img.src = e.target.result;
    //                 img.className = "preview-img";
    //                 this.reviewImagesPreview.appendChild(img);
    //             };
    //             reader.readAsDataURL(file);
    //         });
    //     });
    // }

    bindReviewImages() {
        if (!this.reviewUploadBtn || !this.reviewImagesInput) return;

        this.reviewUploadBtn.addEventListener("click", () => this.reviewImagesInput.click());

        this.reviewImagesInput.addEventListener("change", () => {
            const files = Array.from(this.reviewImagesInput.files);

            // ✅ Giới hạn tối đa 5 ảnh
            if (files.length > 5) {
                showToast("Chỉ được chọn tối đa 5 ảnh!", "warning");
                // Cắt bớt danh sách file còn 5 ảnh đầu
                const dataTransfer = new DataTransfer();
                files.slice(0, 5).forEach(file => dataTransfer.items.add(file));
                this.reviewImagesInput.files = dataTransfer.files;
            }

            // Hiển thị preview
            this.reviewImagesPreview.innerHTML = "";
            Array.from(this.reviewImagesInput.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = e => {
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.className = "preview-img";
                    this.reviewImagesPreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }


    bindSubmitReview() {
        if (!this.submitReviewBtn) return;

        this.submitReviewBtn.addEventListener("click", async () => {
            const orderId = this.reviewModal.dataset.orderId;
            const itemId = this.reviewModal.dataset.itemId;

            if (!orderId || !itemId) return;

            const rating = this.selectedRating;
            const comment = this.reviewTextarea.value.trim();

            const formData = new FormData();
            formData.append("rating", rating);
            formData.append("comment", comment);

            // ảnh
            Array.from(this.reviewImagesInput.files).forEach(file => {
                formData.append("images", file);
            });

            try {
                showLoading("Đang gửi đánh giá...");

                const res = await fetch(`/api/orders/${orderId}/items/${itemId}/review`, {
                    method: "POST",
                    body: formData
                });
                const data = await res.json();
                hideLoading();

                if (res.ok) {
                    showToast(data.message || "Đánh giá thành công!", "success");
                    this.closeReviewModal();

                    // cập nhật button sang đã đánh giá
                    const btn = document.querySelector(`.btn-review[data-item-id="${itemId}"]`);
                    if (btn) {
                        btn.outerHTML = `<span class="text-success">Đã đánh giá</span>`;
                    }

                } else {
                    showToast(data.message || "Đánh giá thất bại!", "error");
                }
            } catch (err) {
                hideLoading();
                console.error(err);
                showToast("Có lỗi xảy ra khi đánh giá!", "error");
            }
        });
    }
}

export default new Orders();
