export default class Select {
    constructor(container) {
        this.container = container;
        this.type = container.dataset.type || "single";
        this.input = container.querySelector(".select-input");
        this.dropdown = container.querySelector(".select-dropdown");
        this.items = container.querySelectorAll(".select-item");
        this.selectedValues = [];

        this.bindEvents();
    }

    bindEvents() {
        // Toggle dropdown khi click vào input
        this.input.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Chọn item
        this.items.forEach((item) => {
            item.addEventListener("click", () => {
                const value = item.dataset.value;
                const text = item.textContent;

                if (this.type === "single") {
                    this.selectedValues = [value];
                    this.input.value = text;
                    this.items.forEach((i) => i.classList.remove("selected"));
                    item.classList.add("selected");
                    this.hideDropdown();
                } else {
                    // multi
                    if (this.selectedValues.includes(value)) {
                        this.selectedValues = this.selectedValues.filter((v) => v !== value);
                        item.classList.remove("selected");
                    } else {
                        this.selectedValues.push(value);
                        item.classList.add("selected");
                    }
                    this.input.value = this.selectedValues.join(", ");
                }
            });
        });

        // Click ngoài thì đóng dropdown
        document.addEventListener("click", () => {
            this.hideDropdown();
        });
    }

    toggleDropdown() {
        this.dropdown.classList.toggle("show");
    }

    hideDropdown() {
        this.dropdown.classList.remove("show");
    }
}