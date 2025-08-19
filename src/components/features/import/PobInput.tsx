

import React, { useState, useEffect } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useChat } from '@/hooks/useChat';
import { AnalysisGoal, LeagueContext } from '@/types';
import { logService } from '@/services/logService';
import { decodePobCode, isPobCode } from '@/services/pobUtils';
import { useError } from '@/contexts/ErrorContext';

type ImportMethod = 'account' | 'manual';

const PreflightCheckView: React.FC = () => {
    const { preflightResult, view, handleAnalysis, resetAnalysis, preflightError } = useAnalysis();
    const { initializeChat } = useChat();
    const isLoading = view === 'loading';
    const { showError } = useError();

    useEffect(() => {
        if (preflightError) {
            showError(preflightError, 'error');
        }
    }, [preflightError, showError]);

    if (preflightError) {
        return (
             <div className="preflight-check-view text-center">
                <p className="text-lg text-red">Pre-Flight Check Failed. Please try again or check your PoB code/URL.</p>
                <h4 className="text-lg text-red">Pre-Flight Check Failed</h4>
                <p className="opacity-90 mt-2">{preflightError}</p>
                <button onClick={resetAnalysis} className="button button-secondary mt-4">Try Again</button>
            </div>
        )
    }

    if (!preflightResult) {
        return (
            <div className="flex-col items-center justify-center" style={{height: '12rem'}}>
                <p>Running Pre-Flight Check...</p>
                <p className="text-yellow mt-4">Running Pre-Flight Check...</p>
            </div>
        );
    }

    return (
        <div className="preflight-check-view animate-fade-in text-center">
            <p>Build Identified. Confirm and analyze the character.</p>
            <h4 className="text-lg text-green">Build Identified</h4>
            <p className="opacity-70 mt-1">The AI has identified the following character. Does this look correct?</p>
            <ul className="preflight-list">
                <li><span className="label">Level:</span> <span className="value">{preflightResult.level}</span></li>
                <li><span className="label">Class:</span> <span className="value">{preflightResult.characterClass}</span></li>
                <li><span className="label">Ascendancy:</span> <span className="value">{preflightResult.ascendancy}</span></li>
                <li><span className="label">Main Skill:</span> <span className="value">{preflightResult.mainSkill}</span></li>
            </ul>

            <div className="flex-row gap-4 justify-center mt-6">
                 <button onClick={resetAnalysis} disabled={isLoading} className="button button-secondary">
                    Cancel
                </button>
                <button onClick={() => handleAnalysis(initializeChat)} disabled={isLoading} className="button button-primary">
                    <span>Confirm and analyze the character.</span>
                    Confirm & Analyze
                </button>
            </div>
        </div>
    );
};

const AccountImportView: React.FC = () => {
    const { 
        accountName, setAccountName, characters, isFetchingCharacters, 
        handleFetchCharacters, handleSelectCharacter, resetImport, 
        isFetchingPobData, selectedCharacter, handleCharacterAnalysis, error
    } = useAnalysis();
    const { showError } = useError();
    
    const isBusy = isFetchingCharacters || isFetchingPobData;
    
    useEffect(() => {
        if (error) {
            showError(error, 'error');
        }
    }, [error, showError]);

    if (isFetchingPobData) {
        return (
            <div className="flex-col items-center justify-center" style={{height: '12rem'}}>
                <p>Fetching build data from PoE account.</p>
                <p className="text-yellow mt-4">Fetching build data...</p>
            </div>
        )
    }

    if (selectedCharacter) {
        return (
            <div className="text-center flex-col gap-4" style={{backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-divider)'}}>
                <div>
                    <h4 className="text-lg text-green">Character Selected</h4>
                    <p className="text-xl font-bold mt-1">{selectedCharacter.name}</p>
                    <p className="opacity-70">Level {selectedCharacter.level} {selectedCharacter.class}</p>
                </div>
                <div className="pt-4" style={{borderTop: '1px solid var(--color-divider)'}}>
                     <button
                        onClick={() => handleCharacterAnalysis(accountName, selectedCharacter.name)}
                        disabled={isBusy}
                        className="button button-primary w-full"
                    >
                        {isBusy ? 'Fetching build data...' : <span>Fetch Build & Run Pre-Flight</span>}
                    </button>
                </div>
                <button
                    onClick={resetImport}
                    disabled={isBusy}
                    className="chromatic-aberration mt-4 text-sm text-sky"
                    style={{background: 'none', border: 'none', cursor: 'pointer', opacity: isBusy ? 0.5 : 1}}
                >
                    Import another character or account
                </button>
            </div>
        )
    }

    if (isFetchingCharacters) {
        return (
            <div className="flex-col items-center justify-center" style={{height: '12rem'}}>
                <p>Fetching characters from PoE account.</p>
                <p className="text-yellow mt-4">Fetching characters...</p>
            </div>
        )
    }

    if (characters.length > 0) {
        return (
             <div>
                <h3 className="text-lg text-yellow mb-2">Select a Character</h3>
                <div className="flex-col gap-2">
                    {characters.map(char => (
                        <button
                            key={char.name}
                            onClick={() => handleSelectCharacter(char)}
                            className="button button-secondary"
                            style={{textAlign: 'left', width: '100%', justifyContent: 'flex-start'}}
                        >
                           <div style={{flexGrow: 1}}>
                               <p className="font-bold">{char.name}</p>
                               <p className="text-sm opacity-70">Level {char.level} {char.class}</p>
                           </div>
                        </button>
                    ))}
                </div>
                 <button
                    onClick={resetImport}
                    disabled={isBusy}
                    className="chromatic-aberration mt-4 text-sm text-sky"
                    style={{background: 'none', border: 'none', cursor: 'pointer', opacity: isBusy ? 0.5 : 1}}
                >
                    Back
                </button>
            </div>
        )
    }

    return (
        <div className="flex-col gap-4">
             <div>
                <label htmlFor="account-name" className="block text-lg text-yellow mb-2">
                    PoE Account Name
                </label>
                <p className="text-sm opacity-70 mb-4">
                    Enter your account name. Your profile must be set to public on pathofexile.com.
                </p>
                <div className="flex-row gap-2">
                    <input
                        id="account-name"
                        type="text"
                        className="input-field"
                        style={{flexGrow: 1}}
                        placeholder="YourAccountName"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        disabled={isBusy}
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchCharacters()}
                    />
                     <button
                        onClick={handleFetchCharacters}
                        disabled={isBusy || !accountName.trim()}
                        className="button text-black"
                        style={{backgroundColor: 'var(--color-sky)'}}
                    >
                        Fetch
                    </button>
                </div>
            </div>
        </div>
    )
}

const ManualImportView: React.FC = () => {
    const { pobInput, setPobInput, pobUrl, setPobUrl, view, handlePreflightCheck, preflightResult, isPreflighting, preflightError } = useAnalysis();
    const isLoading = view === 'loading';
    const showPreflight = !!(isPreflighting || preflightResult || preflightError);

    const [rawInput, setRawInput] = useState(pobInput);
    const [validationStatus, setValidationStatus] = useState<{status: 'idle' | 'validating' | 'valid' | 'invalid', message: string}>({status: 'idle', message: ''});
    const { showError } = useError();

    useEffect(() => {
        const handler = setTimeout(() => {
            const input = rawInput.trim();
            if (!input) {
                setValidationStatus({ status: 'idle', message: '' });
                if (pobInput) setPobInput('');
                return;
            }
            setValidationStatus({ status: 'validating', message: '' });
            if (isPobCode(input)) {
                try {
                    const xml = decodePobCode(input);
                    setPobInput(xml);
                    setValidationStatus({ status: 'valid', message: '' });
                    showError('PoB code decoded successfully.', 'info');
                } catch (e) {
                    setPobInput('');
                    setValidationStatus({ status: 'invalid', message: '' });
                    showError((e as Error).message, 'error');
                }
            } else if (input.startsWith('<')) {
                setPobInput(input);
                setValidationStatus({ status: 'valid', message: '' });
                showError('XML data recognized.', 'info');
            } else {
                setPobInput('');
                setValidationStatus({ status: 'invalid', message: '' });
                showError('Invalid format. Paste a PoB code or full XML.', 'error');
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [rawInput, setPobInput, pobInput, showError]);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setRawInput(text);
            logService.info("Pasted PoB data from clipboard.");
        } catch (err) {
            logService.error("Failed to read clipboard contents.", { error: err });
            showError("Could not read from clipboard. Please paste manually or ensure clipboard access is granted.", 'error'); 
        }
    };

    const getBorderColor = () => {
        if (validationStatus.status === 'valid') return 'var(--color-green)';
        if (validationStatus.status === 'invalid') return 'var(--color-red)';
        return 'var(--color-glow-secondary)';
    };

    const isReadyForPreflight = validationStatus.status === 'valid' && pobUrl.trim().length > 10;

    return (
        <div className="flex-col gap-6">
            <div>
                <div className="flex-row justify-between items-center mb-2">
                    <label htmlFor="pob-input" className="block text-lg text-yellow">
                        Step 1: Path of Building Data
                    </label>
                    <button onClick={handlePaste} disabled={isLoading || showPreflight} className="button button-secondary" style={{padding: '0.25rem 0.75rem', fontSize: '0.75rem'}}>
                        <span>Paste your Path of Building pastebin link or import code here.</span>
                        <span>Paste</span>
                    </button>
                </div>
                <p className="text-sm opacity-70 mb-4">
                In PoB, go to Import/Export Build, click "Generate", and copy the code. You can paste the code or the full XML.
                </p>
                <textarea
                    id="pob-input"
                    className="textarea-field"
                    style={{height: '8rem', borderColor: getBorderColor()}}
                    placeholder="Paste your PoB code or full XML export here..."
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    disabled={isLoading || showPreflight}
                />
            </div>
            <div>
                <label htmlFor="pob-url" className="block text-lg text-yellow mb-2">
                Step 2: Public Build URL
                </label>
                <p className="text-sm opacity-70 mb-4">
                Share your build to a site like <code style={{background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.3rem', borderRadius: '4px'}}>pobb.in</code> and paste the URL.
                </p>
                <input
                    id="pob-url"
                    type="url"
                    className="input-field"
                    placeholder="e.g., https://pobb.in/..."
                    value={pobUrl}
                    onChange={(e) => setPobUrl(e.target.value)}
                    disabled={isLoading || showPreflight}
                />
            </div>

            <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--color-divider)]">
                <p className="text-center text-sm opacity-70 mb-4">Adjust context below, then run the pre-flight check to continue.</p>
                <button
                    onClick={() => handlePreflightCheck(pobInput)}
                    disabled={!isReadyForPreflight || isLoading || showPreflight}
                    className="button button-primary w-full"
                >
                    <span>Run the pre-flight check to analyze the character.</span>
                    <span>Run Pre-Flight Check</span>
                </button>
            </div>
        </div>
    );
};

// Wrapper component: renders tabs and selected import view
const PobInput: React.FC = () => {
  const [importMethod, setImportMethod] = useState<ImportMethod>('account');
  const { view, leagueContext, setLeagueContext, analysisGoal, setAnalysisGoal, isPreflighting, preflightResult, preflightError } = useAnalysis();
  const isLoading = view === 'loading';
  const showPreflight = !!(isPreflighting || preflightResult || preflightError);

  const tabs: { id: ImportMethod; label: string }[] = [
    { id: 'account', label: 'Import from Account' },
    { id: 'manual', label: 'Import Manually' },
  ];

  return (
    <div className="card p-6 flex-col gap-6">
      <div className="tabs" role="tablist" aria-label="Import Method">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={importMethod === tab.id}
            aria-controls="import-panel"
            onClick={() => setImportMethod(tab.id)}
            className={`tab-button ${importMethod === tab.id ? 'active' : ''}`}
            disabled={showPreflight}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id="import-panel" role="tabpanel" aria-labelledby={`tab-${importMethod}`} className="pt-4">
        {showPreflight ? (
          <PreflightCheckView />
        ) : importMethod === 'account' ? (
          <AccountImportView />
        ) : (
          <ManualImportView />
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <span>Select the league context for the character.</span>
          <label htmlFor="league-context" className="block text-lg text-yellow mb-2">
            League Context:
          </label>
          <select
            id="league-context"
            className="input-field"
            value={leagueContext}
            onChange={(e) => setLeagueContext(e.target.value as LeagueContext)}
            disabled={isLoading || showPreflight}
          >
            <option value="Standard">Standard</option>
            <option value="Hardcore">Hardcore</option>
            <option value="SSF">SSF</option>
            <option value="HCSSF">HCSSF</option>
          </select>
        </div>
        <div className="flex-grow">
          <span>Select the analysis goal for the character.</span>
          <label htmlFor="analysis-goal" className="block text-lg text-yellow mb-2">
            Analysis Goal:
          </label>
          <select
            id="analysis-goal"
            className="input-field"
            value={analysisGoal}
            onChange={(e) => setAnalysisGoal(e.target.value as any)}
            disabled={isLoading || showPreflight}
          >
            <option value="Build">Build</option>
            <option value="Item">Item</option>
            <option value="Passive">Passive</option>
            <option value="Skill">Skill</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default PobInput;