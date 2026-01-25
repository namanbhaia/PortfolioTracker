

// 1. Helper to get today's date in YYYY-MM-DD format (Local Timezone)
const getTodayDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};


export { getTodayDate }