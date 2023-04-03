// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// import { Transaction } from '@mysten/sui.js';
import { TransactionBlock } from '@mysten/sui.js';
import { useMemo, useState } from 'react';

import { ConfirmationModal } from '../../../shared/ConfirmationModal';
import { GasFees } from './GasFees';
import { TransactionDetails } from './TransactionDetails';
import { UserApproveContainer } from '_components/user-approve-container';
import { useAppDispatch, useSigner, useTransactionData } from '_hooks';
import { type TransactionApprovalRequest } from '_payloads/transactions/ApprovalRequest';
import { respondToTransactionRequest } from '_redux/slices/transaction-requests';
import { PageMainLayoutTitle } from '_src/ui/app/shared/page-main-layout/PageMainLayoutTitle';

import st from './TransactionRequest.module.scss';

export type TransactionRequestProps = {
    txRequest: TransactionApprovalRequest;
};

export function TransactionRequest({ txRequest }: TransactionRequestProps) {
    const addressForTransaction = txRequest.tx.account;
    const signer = useSigner(addressForTransaction);
    const dispatch = useAppDispatch();
    const transaction = useMemo(() => {
        const tx = TransactionBlock.from(txRequest.tx.data);
        if (addressForTransaction) {
            tx.setSenderIfNotSet(addressForTransaction);
        }
        return tx;
    }, [txRequest.tx.data, addressForTransaction]);
    const { isLoading, isError } = useTransactionData(
        addressForTransaction,
        transaction
    );
    const [isConfirmationVisible, setConfirmationVisible] = useState(false);
    return (
        <>
            <UserApproveContainer
                origin={txRequest.origin}
                originFavIcon={txRequest.originFavIcon}
                approveTitle="Approve"
                rejectTitle="Reject"
                onSubmit={async (approved: boolean) => {
                    if (isLoading) {
                        return;
                    }
                    if (isError) {
                        setConfirmationVisible(true);
                        return;
                    }
                    await dispatch(
                        respondToTransactionRequest({
                            approved,
                            txRequestID: txRequest.id,
                            signer,
                        })
                    );
                }}
                address={addressForTransaction}
                approveLoading={isLoading || isConfirmationVisible}
            >
                <PageMainLayoutTitle title="Approve Transaction" />
                <section className={st.txInfo}>
                    {/* MUSTFIX(chris) */}
                    {/* <TransactionSummaryCard
                    transaction={tx}
                    address={addressForTransaction}
                /> */}
                    <GasFees
                        sender={addressForTransaction}
                        transaction={transaction}
                    />
                    <TransactionDetails
                        sender={addressForTransaction}
                        transaction={transaction}
                    />
                </section>
            </UserApproveContainer>
            <ConfirmationModal
                isOpen={isConfirmationVisible}
                title="This transaction might fail. Are you sure you still want to Approve the transaction?"
                hint="You will still be charged a gas fee for this transaction."
                confirmStyle="primary"
                confirmText="Approve"
                cancelText="Reject"
                cancelStyle="warning"
                onResponse={async (isConfirmed) => {
                    await dispatch(
                        respondToTransactionRequest({
                            approved: isConfirmed,
                            txRequestID: txRequest.id,
                            signer,
                        })
                    );
                    setConfirmationVisible(false);
                }}
            />
        </>
    );
}
