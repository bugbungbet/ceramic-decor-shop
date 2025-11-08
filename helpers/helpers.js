module.exports = {
  eq: (a, b) => a === b,
  not: (v) => !v,
  and: (a, b) => a && b,
  or: (a, b) => a || b,
  gt: (a, b) => Number(a) > Number(b),
  gtBool: (a, b) => {
    return a > b;
  },
  paginationPages: (totalPages, currentPage) => {
    const pages = [];
    const delta = 2;
    const range = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }

    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    for (const page of range) {
      pages.push({
        page,
        active: page === currentPage,
        isEllipsis: page === '...'
      });
    }

    return pages;
  },
  plusOne: (value) => {
    return parseInt(value) + 1;
  },
  formatCurrency: (value) => {
    if (isNaN(value)) return '0₫';
    return Number(value).toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    });
  },

  formatDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  },

  translateStockStatus: (status) => {
    const map = {
      draft: 'Nháp',
      imported: 'Đã nhập kho',
      cancelled: 'Đã hủy/Tạm dừng',
      discontinued: 'Ngừng bán',
      sold_out: 'Hết hàng'
    };
    return map[status] || 'Không xác định';
  }
};
