'use client';
import { useCredentialNullSafe } from '@/store';
import { Queries } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useBalancesQuery = () => {
    const credential = useCredentialNullSafe();

    const query = useQuery({
        queryKey: [Queries.BALANCES, credential.publicAddress],
        queryFn: async () => {
            // const balances = await Multicall.getTokenBalances(
            //     credential.publicAddress,
            //     tokens.map((t) => t.address),
            // );
            // const returnData: Balances = {};
            // if (balances) {
            //     balances.forEach((balance) => {
            //         returnData[balance.address] = balance.balance;
            //     });
            //     setBalances(returnData);
            // }
            // setIsBalancesSet(true);
            // return returnData;
        },
        refetchInterval: 10000,
        gcTime: Infinity,
    });

    useEffect(() => {
        query.refetch();
    }, [credential.publicAddress]);

    return query;
};
