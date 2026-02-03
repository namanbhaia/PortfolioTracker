

// 1. Helper to get today's date in YYYY-MM-DD format (Local Timezone)
export const getTodayDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

/**
 * @function isLongTerm
 * @description Checks if an investment is "Long Term" by comparing the holding period against 365 days.
 * @param {Date | string} purchaseDate - The date the asset was purchased.
 * @param {Date | string} saleDate - The date the asset was sold (defaults to current date for unrealized checks).
 * @returns {boolean} - True if the holding period is greater than 365 days.
 */
export const isLongTerm = (purchaseDate: string | Date, saleDate: string | Date = new Date()): boolean => {
    // Normalize inputs to Date objects
    const start = new Date(purchaseDate);
    const end = new Date(saleDate);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 365;
};