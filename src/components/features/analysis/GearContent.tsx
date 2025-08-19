

import React, { useState } from 'react';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { UserMod } from '../../../types';
import { GearItemCard } from '../../ui/GearItemCard';
import { Icon } from '../../ui/Icon';
import { ExpandableSuggestion } from '../info/InfoBoxes';
import { ImpactProjection, MetaValidation } from '../info/InfoBoxes';
import { Spinner } from '../../ui/Spinner';

const UpgradeFinder: React.FC<{ slot: string }> = ({ slot }) => {
    const { upgrades, handleFindUpgrade } = useAnalysis();
    const [budget, setBudget] = useState('1 Divine');
    const upgradeState = upgrades[slot];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFindUpgrade(slot, budget);
    }
    
    if (upgradeState?.isLoading) {
        return (
            <div className="mt-4 pt-4 border-t border-[var(--color-divider)] flex flex-col items-center justify-center">
                <Spinner/>
                <p className="text-yellow mt-2">AI is searching the trade site...</p>
            </div>
        );
    }

    if(upgradeState?.error) {
         return (
            <div className="mt-4 pt-4 border-t border-[var(--color-divider)] text-center text-red">
                <p>{upgradeState.error}</p>
                <button onClick={() => handleFindUpgrade(slot, budget)} className="button button-secondary mt-2">Retry</button>
            </div>
        );
    }

    if(upgradeState?.result) {
        return (
            <div className="upgrade-finder-result">
                <h6 className="font-bold text-sm text-sky mb-2">UPGRADE FOUND</h6>
                <p className="text-sm mb-3">{upgradeState.result.explanation}</p>
                <a href={upgradeState.result.tradeUrl} target="_blank" rel="noopener noreferrer" className="button button-primary">
                    <Icon name="externalLink" />
                    <span>Open Trade Link</span>
                </a>
            </div>
        )
    }

    return (
        <form className="upgrade-finder-form" onSubmit={handleSubmit}>
            <input 
                type="text" 
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="input-field"
                placeholder="e.g. 50 chaos"
            />
            <button type="submit" className="button button-secondary" style={{backgroundColor: 'var(--color-sky)', color: '#000'}}>
                <Icon name="currency" />
                <span>Find</span>
            </button>
        </form>
    );
};


export const GearContent: React.FC = () => {
    const { analysisResult } = useAnalysis();
    if (!analysisResult) return null;

    const transformMods = (mods: UserMod[], type: 'good' | 'bad') => mods.map(m => ({ text: m.text, tier: m.tier, type }));

    return (
        <div className="flex-col gap-6">
            {analysisResult.gearAnalysis.map((piece, index) => (
                <div key={index} className="card p-4" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
                    <div className="flex-row justify-between items-center mb-4 flex-wrap">
                        <h4 className="text-xl text-yellow">{piece.slot}</h4>
                        {piece.upgradePrice && <p className="text-sm text-yellow flex-row items-center gap-1"><Icon name="currency" style={{width: '1rem', height: '1rem'}} />EST: {piece.upgradePrice}</p>}
                    </div>
                    
                    <div className="gear-comparison-grid">
                        <GearItemCard
                            title="Your Item"
                            itemName={piece.itemName}
                            mods={[...transformMods(piece.goodMods, 'good'), ...transformMods(piece.badMods, 'bad')]}
                        />
                        {piece.suggestedItem ? (
                             <GearItemCard
                                title="Suggested Upgrade"
                                itemName={piece.suggestedItem.name}
                                mods={piece.suggestedItem.mods.map(m => ({ text: m, tier: '', type: 'bis' }))}
                                isSuggestion
                            />
                        ) : (
                            <div className="gear-item-card flex-col items-center justify-center text-center opacity-70">
                                <Icon name="check" className="text-green" style={{width: '2rem', height: '2rem', marginBottom: '0.5rem'}}/>
                                <p className="font-bold">No simple upgrade suggested.</p>
                                <p className="text-sm">This piece is likely well-optimized.</p>
                            </div>
                        )}
                    </div>

                    {(piece.projectedImpact || piece.metaValidation) && (
                        <div className="mt-4 pt-3 flex flex-col gap-3" style={{borderTop: '1px solid var(--color-divider)'}}>
                             {piece.projectedImpact && <ImpactProjection impacts={piece.projectedImpact} />}
                             {piece.metaValidation && <MetaValidation validation={piece.metaValidation} sources={analysisResult.groundingMetadata} />}
                        </div>
                    )}


                    {piece.suggestions.length > 0 && (
                        <div className="mt-4 pt-3" style={{borderTop: '1px solid var(--color-divider)'}}>
                            <h5 className="text-sm text-yellow mb-2">SUGGESTIONS/CRAFTING:</h5>
                            <div className="flex-col gap-2">{piece.suggestions.map((sug, i) => <ExpandableSuggestion key={i} suggestion={sug} />)}</div>
                        </div>
                    )}

                    <div className="mt-4 pt-4" style={{borderTop: '2px dashed var(--color-divider)'}}>
                        <h5 className="font-bold text-sky text-center">AI Trade Search</h5>
                        <p className="text-sm text-center opacity-70 mb-3">Enter a budget to find an upgrade on the trade site.</p>
                        <UpgradeFinder slot={piece.slot} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GearContent;