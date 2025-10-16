import React from 'react';
import { RouteGuard } from '../../components/guards/RouteGuard';
import { TransferForm } from '../../components/transfer/TransferForm';

export const TransferPage: React.FC = () => {
  return (
    <RouteGuard>
      <div className="transfer-page">
        <h1>Transfer Points & Credits</h1>
        <TransferForm />
      </div>
    </RouteGuard>
  );
};