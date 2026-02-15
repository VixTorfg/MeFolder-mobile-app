import React from 'react';
import { ViewCardsProps } from '@/types';
import { View } from 'react-native';
import { ContentCard, GridCard, ListCard } from '../ViewCards';

export default function ViewCards({ viewConfig, ...cardProps }: ViewCardsProps) {

    const renderCard = () => {
        switch (viewConfig) { //futuro viewConfig?.mode
            case 'list':
                return <ListCard {...cardProps} />;
            case 'grid':
                return <GridCard {...cardProps} />;
            case 'big_icon':
                return <View style={{ flexDirection: 'column' }} />;
            case 'medium_icon':
                return <View style={{ flexDirection: 'column' }} />;
            case 'small_icon':
                return <View style={{ flexDirection: 'column' }} />;
            case 'content':
                return <ContentCard {...cardProps} />;
            default:
                return <View style={{ flexDirection: 'row' }} />;
        }
    };

    return renderCard();
}