
import HoldingsFilters from '@/components/holdings-filters';
import TestHoldingsTable from '@/components/test-holdings-table';

export default function TestPage() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Filter Test Page</h1>
            <HoldingsFilters />
            <TestHoldingsTable />
        </div>
    );
}
