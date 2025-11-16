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

    }

    applyAnimationDelay(selector, step = 0.1) {
        const items = document.querySelectorAll(selector);

        items.forEach((el, index) => {
            const delay = index * step;
            el.style.animationDelay = `${delay}s`;
        });
    }

    bindEvents() {

        const el = document.querySelector('.custom-select');
        const select = new Select(el, {
            onChange: async (newVal, oldVal) => {
                if (oldVal === 'delivered' || oldVal === 'cancelled' || oldVal === 'returned') {
                    // không cho thay đổi trạng thái nếu đơn đã kết thúc
                    return false;
                }

                const confirmed = await showConfirm(
                    `Bạn có chắc chắn muốn chuyển trạng thái từ "${oldVal}" sang "${newVal}" không?`
                );
                if (!confirmed) return false;

                const orderId = el.id.replace('orderSelect_', '');

                try {
                    const res = await fetch(`/api/orders/${orderId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newVal }),
                    });

                    const result = await res.json();
                    if (!res.ok) {
                        showToast(result.message || 'Lỗi cập nhật trạng thái', 'error');
                        return false;
                    }

                    // const { status: updatedStatus, allowedNextStatuses } = result.data;

                    // // Cập nhật select
                    // select.setValue(updatedStatus);
                    // const trigger = el.querySelector('.cs-trigger');
                    // trigger.classList.remove(oldVal);
                    // trigger.classList.add(updatedStatus);

                    // // Render options tiếp theo
                    // const translateMap = {
                    //     pending: 'Chờ xác nhận',
                    //     confirmed: 'Đã xác nhận',
                    //     preparing: 'Đang chuẩn bị',
                    //     shipping: 'Đang giao',
                    //     delivered: 'Đã giao',
                    //     cancelled: 'Đã hủy',
                    //     returned: 'Trả hàng'
                    // };

                    // const newItems = [
                    //     { value: updatedStatus, label: translateMap[updatedStatus] || updatedStatus },
                    //     ...allowedNextStatuses.map(st => ({ value: st, label: translateMap[st] || st }))
                    // ];

                    // select.setOptions(newItems);

                    const { status: updatedStatus, allowedNextStatuses } = result.data;

                    // Set giá trị hiện tại
                    select.setValue(updatedStatus);
                    const trigger = el.querySelector('.cs-trigger');
                    trigger.classList.remove(oldVal);
                    trigger.classList.add(updatedStatus);

                    // Render options chỉ gồm các trạng thái tiếp theo
                    const translateMap = {
                        pending: 'Chờ xác nhận',
                        confirmed: 'Đã xác nhận',
                        preparing: 'Đang chuẩn bị',
                        shipping: 'Đang giao',
                        delivered: 'Đã giao',
                        cancelled: 'Hủy'
                        // returned: 'Trả hàng'
                    };

                    const newItems = allowedNextStatuses.map(st => ({
                        value: st,
                        label: translateMap[st] || st
                    }));

                    select.setOptions(newItems);

                    showToast('Cập nhật trạng thái thành công', 'success');
                    return true;

                } catch (err) {
                    console.error(err);
                    alert('Lỗi khi gọi API');
                    return false;
                }
            }
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
}

export default new StockEntries();
