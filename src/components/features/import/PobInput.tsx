

import React, { useState, useEffect } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useChat } from '@/hooks/useChat';
import { type AnalysisGoal, type LeagueContext } from '@/types';
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
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [poeSessid, setPoeSessid] = useState<string>(() => {
        try { return localStorage.getItem('poe-sessid') || ''; } catch { return ''; }
    });
    const [sessStatus, setSessStatus] = useState<string>('');
    
    const getCookie = (name: string): string | null => {
        try {
            const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
            return m ? decodeURIComponent(m[1]) : null;
        } catch { return null; }
    };
    
    const applySessid = () => {
        try {
            if (!poeSessid.trim()) {
                // Clear
                document.cookie = 'POESESSID=; path=/; max-age=0';
                try { localStorage.removeItem('poe-sessid'); } catch {}
                setSessStatus('Cleared');
                showError('Cleared POESESSID from this app session.', 'info');
                return;
            }
            // Persist for 30 days
            document.cookie = `POESESSID=${encodeURIComponent(poeSessid.trim())}; path=/; max-age=2592000`;
            try { localStorage.setItem('poe-sessid', poeSessid.trim()); } catch {}
            setSessStatus('Saved');
            showError('POESESSID saved for this app domain. Try FETCH again.', 'info');
        } catch (e) {
            setSessStatus('Error');
            showError('Could not set POESESSID cookie. Try manual import or check browser settings.', 'error');
        }
    };
    
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
                    PoE Account Handle
                </label>
                <p className="text-sm opacity-70 mb-4">
                    Enter your full handle including the discriminator. Example: <code>Hettii#6037</code>. Your profile must be set to public on pathofexile.com.
                </p>
                <div className="flex-row gap-2">
                    <input
                        id="account-name"
                        type="text"
                        className="input-field"
                        style={{flexGrow: 1}}
                        placeholder="e.g., Hettii#6037"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        disabled={isBusy}
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchCharacters()}
                    />
                    <button onClick={handleFetchCharacters} disabled={isBusy || !accountName.trim()} className="button button-primary" style={{padding: '0.5rem 1rem'}}>FETCH</button>
                </div>
                <div className="mt-2">
                    <button
                        onClick={() => setShowAdvanced(v => !v)}
                        className="chromatic-aberration text-sm text-sky"
                        style={{background: 'none', border: 'none', cursor: 'pointer'}}
                    >
                        {showAdvanced ? 'Hide Advanced' : 'Advanced'}
                    </button>
                </div>
                {showAdvanced && (
                    <div className="mt-2 p-3" style={{backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid var(--color-divider)'}}>
                        <p className="text-sm opacity-70 mb-2">Optional: paste your <code>POESESSID</code> (session cookie) if PoE still blocks public API requests in your region. Paste to enable private/gated character fetching. Leave empty and click Save to clear.</p>
                        <div className="flex-row gap-2">
                            <input
                                type="password"
                                className="input-field"
                                placeholder="POESESSID value"
                                value={poeSessid}
                                onChange={(e) => setPoeSessid(e.target.value)}
                                style={{flexGrow: 1}}
                                autoComplete="off"
                            />
                            <button onClick={applySessid} className="button button-secondary" style={{padding: '0.5rem 1rem'}}>Save</button>
                        </div>
                        <div className="text-sm mt-2 opacity-70">Status: {sessStatus || (getCookie('POESESSID') ? 'Detected' : 'Not set')}</div>
                    </div>
                )}
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
                    <button
                        onClick={handlePaste}
                        disabled={isLoading || showPreflight}
                        className="button button-secondary"
                        style={{padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: '#fff'}}
                        aria-label="Paste"
                    >
                        PASTE
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

      <div className="flex flex-col gap-4">
        <div>
          <span className="block mb-2">Select the league context for the character.</span>
          <div className="segmented-toggle" role="group" aria-label="League Context">
            {(['League Start','Mid-League','Endgame'] as LeagueContext[]).map((opt) => (
              <button
                key={opt}
                type="button"
                className={`toggle-option ${leagueContext === opt ? 'active' : ''}`}
                onClick={() => setLeagueContext(opt)}
                disabled={isLoading || showPreflight}
              >
                <span>{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block mb-2">Select the analysis goal for the character.</span>
          <div className="segmented-toggle" role="group" aria-label="Analysis Goal">
            {(['All-Rounder','Mapping','Bossing'] as AnalysisGoal[]).map((opt) => (
              <button
                key={opt}
                type="button"
                className={`toggle-option ${analysisGoal === opt ? 'active' : ''}`}
                onClick={() => setAnalysisGoal(opt)}
                disabled={isLoading || showPreflight}
              >
                <span>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PobInput;