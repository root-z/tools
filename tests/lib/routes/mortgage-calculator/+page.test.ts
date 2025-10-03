import { describe, expect, it } from 'vitest';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { calculateMortgageSummary } from '$lib';
import MortgageCalculatorPage from '../../../../src/routes/mortgage-calculator/+page.svelte';

describe('mortgage calculator page', () => {
  it('disables the calculate button until required fields are populated', async () => {
    render(MortgageCalculatorPage);

    const calculateButton = screen.getByRole('button', { name: /calculate/i });
    expect(calculateButton).toBeDisabled();

    const principalInput = screen.getByLabelText(/loan amount/i);
    const interestInput = screen.getByLabelText(/annual interest rate/i);
    const termInput = screen.getByLabelText(/loan term/i);

    await fireEvent.input(principalInput, { target: { value: '200000' } });
    expect(calculateButton).toBeDisabled();

    await fireEvent.input(interestInput, { target: { value: '4.5' } });
    expect(calculateButton).toBeDisabled();

    await fireEvent.input(termInput, { target: { value: '30' } });
    expect(calculateButton).not.toBeDisabled();
  });

  it('renders summary results and toggles the amortization schedule', async () => {
    render(MortgageCalculatorPage);

    const principalInput = screen.getByLabelText(/loan amount/i);
    const interestInput = screen.getByLabelText(/annual interest rate/i);
    const termInput = screen.getByLabelText(/loan term/i);
    const extraInput = screen.getByLabelText(/extra payment/i);
    const calculateButton = screen.getByRole('button', { name: /calculate/i });

    await fireEvent.input(principalInput, { target: { value: '300000' } });
    await fireEvent.input(interestInput, { target: { value: '5' } });
    await fireEvent.input(termInput, { target: { value: '30' } });
    await fireEvent.input(extraInput, { target: { value: '200' } });

    await fireEvent.click(calculateButton);

    const expected = calculateMortgageSummary({
      principal: 300_000,
      annualInterestRate: 5,
      termYears: 30,
      extraMonthlyPayment: 200
    });

    const formattedPayment = `$${(expected.monthlyPayment + expected.extraMonthlyPayment).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    await waitFor(() => {
      const paymentSection = screen.getByText(/monthly payment/i).closest('div');
      const interestSection = screen.getByText(/total interest/i).closest('div');

      expect(paymentSection).not.toBeNull();
      expect(interestSection).not.toBeNull();

      if (paymentSection) {
        expect(within(paymentSection).getByText(formattedPayment)).toBeInTheDocument();
      }

      if (interestSection) {
        const formattedInterest = `$${expected.totalInterest.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
        expect(within(interestSection).getByText(formattedInterest)).toBeInTheDocument();
      }
    });

    const toggleButton = screen.getByRole('button', { name: /show schedule/i });
    await fireEvent.click(toggleButton);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    const firstRowPayment = expected.schedule[0]?.totalPayment ?? 0;
    const formattedFirstPayment = `$${firstRowPayment.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('1')).toBeInTheDocument();
    expect(within(firstDataRow).getByText(formattedFirstPayment)).toBeInTheDocument();

    const hideButton = screen.getByRole('button', { name: /hide schedule/i });
    await fireEvent.click(hideButton);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
