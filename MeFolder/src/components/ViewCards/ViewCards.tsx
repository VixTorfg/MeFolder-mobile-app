import React from 'react';
import { ViewCardsProps } from '@/types';
import { View } from 'react-native';
import { ContentCard } from './ContentCard';
import { GridCard } from './GridCard';
import { ListCard } from './ListCard';
import { SizeIconCard } from './SizeIconCard';

export default function ViewCards({ viewConfig, ...cardProps }: ViewCardsProps) {

    const renderCard = () => {
        switch (viewConfig) { //futuro viewConfig?.mode
            case 'list':
                return <ListCard {...cardProps} />;
            case 'grid':
                return <GridCard {...cardProps} />;
            case 'big_icon':
                return <SizeIconCard size={80} {...cardProps} />;
            case 'medium_icon':
                return <SizeIconCard size={52} {...cardProps} />;
            case 'small_icon':
                return <SizeIconCard size={38} {...cardProps} />;
            case 'content':
                return <ContentCard {...cardProps} />;
            default:
                return <View style={{ flexDirection: 'row' }} />;
        }
    };

    return renderCard();
}