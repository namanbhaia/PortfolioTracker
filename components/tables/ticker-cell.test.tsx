import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TickerCell from './ticker-cell';
import React from 'react';

describe('TickerCell', () => {
    it('renders ticker and isin correctly', () => {
        render(
            <table>
                <tbody>
                    <tr>
                        <TickerCell ticker="RELIANCE" isin="INE002A01018" />
                    </tr>
                </tbody>
            </table>
        );

        const link = screen.getByRole('link', { name: 'RELIANCE' });
        expect(link).toBeDefined();
        expect(link.getAttribute('href')).toBe('https://www.screener.in/company/RELIANCE/');
        expect(screen.getByText('INE002A01018')).toBeDefined();
    });

    it('renders copy button with correct aria-label', () => {
        render(
            <table>
                <tbody>
                    <tr>
                        <TickerCell ticker="RELIANCE" isin="INE002A01018" />
                    </tr>
                </tbody>
            </table>
        );

        const copyButton = screen.getByLabelText('Copy ticker RELIANCE');
        expect(copyButton).toBeDefined();
    });
});
