

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { PoeAnalysisResult, PoeCharacter, AnalysisSnapshot, PreflightCheckResult, AnalysisGoal, AppView, LeagueContext, LootFilter, LevelingPlan, TuningGoal, TuningResult, BossingStrategyGuide, ProgressionAlertData } from '@/types';
import * as apiClient from '@/services/apiClient';
import { logService } from '@/services/logService';
import { useChat } from '@/hooks/useChat';
import { useUI } from '@/hooks/useUI';

interface AnalysisContextType {
  // State
  view: AppView;
  pobInput: string;
  pobUrl: string;
  leagueContext: LeagueContext;
  analysisGoal: AnalysisGoal;
  analysisResult: PoeAnalysisResult | null;
  error: string | null;
  currentStepIndex: number;
  isAnalyzing: boolean; // Add isAnalyzing to the context type
  isFetchingCharacters: boolean;
  characters: PoeCharacter[];
  selectedCharacter: PoeCharacter | null;
  accountName: string;
  isFetchingPobData: boolean;
  preflightResult: PreflightCheckResult | null;
  isPreflighting: boolean;
  preflightError: string | null;
  checkedImprovements: Set<string>;
  upgrades: { [slot: string]: { result: { tradeUrl: string, explanation: string } | null, isLoading: boolean, error: string | null } };
  lootFilter: LootFilter | null;
  isGeneratingFilter: boolean;
  filterError: string | null;
  levelingPlan: LevelingPlan | null;
  isGeneratingPlan: boolean;
  planError: string | null;
  tuningResult: TuningResult | null;
  isTuning: boolean;
  tuningError: string | null;
  guideContent: string | null;
  isGeneratingGuide: boolean;
  bossingStrategy: BossingStrategyGuide[] | null;
  isGeneratingBossingStrategy: boolean;
  bossingStrategyError: string | null;
  progressionAlert: ProgressionAlertData | null;

  // Actions
  setPobInput: (s: string) => void;
  setPobUrl: (s: string) => void;
  setLeagueContext: (l: LeagueContext) => void;
  setAnalysisGoal: (g: AnalysisGoal) => void;
  setAccountName: (s: string) => void;
  setAnalysisResult: (result: PoeAnalysisResult | null) => void;
  setView: (view: AppView) => void;
  
  handleFetchCharacters: () => Promise<void>;
  handleCharacterAnalysis: (account: string, character: string) => Promise<void>;
  handleSelectCharacter: (character: PoeCharacter) => void;
  resetImport: () => void;
  handleAnalysis: (onSuccess: (result: PoeAnalysisResult) => void) => Promise<void>;
  handlePreflightCheck: (pobData?: string) => Promise<void>;
  handleToggleImprovement: (id: string) => void;
  handleFindUpgrade: (slot: string, budget: string) => Promise<void>;
  handleGenerateLootFilter: () => Promise<void>;
  handleGenerateLevelingPlan: () => Promise<void>;
  handleTuneBuild: (goal: TuningGoal) => Promise<void>;
  handleGenerateGuide: () => Promise<void>;
  handleGenerateBossingStrategy: () => Promise<void>;
  loadSnapshotAndCheckProgression: (snapshot: AnalysisSnapshot, history: AnalysisSnapshot[]) => void;
  clearProgressionAlert: () => void;
  resetAnalysis: () => void;
}

export const AnalysisContext = createContext<AnalysisContextType | null>(null);

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<AppView>('welcome');
  const [pobInput, setPobInput] = useState('');
  const [pobUrl, setPobUrl] = useState('');
  const [leagueContext, setLeagueContext] = useState<LeagueContext>(() => (localStorage.getItem('poe-ai-league-context') as LeagueContext) || 'League Start');
  const [analysisGoal, setAnalysisGoal] = useState<AnalysisGoal>('All-Rounder');
  const [analysisResult, setAnalysisResult] = useState<PoeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Import State
  const [isFetchingCharacters, setIsFetchingCharacters] = useState(false);
  const [characters, setCharacters] = useState<PoeCharacter[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<PoeCharacter | null>(null);
  const [accountName, setAccountName] = useState(() => localStorage.getItem('poe-ai-account-name') || '');
  const [isFetchingPobData, setIsFetchingPobData] = useState(false);
  const [preflightResult, setPreflightResult] = useState<PreflightCheckResult | null>(null);
  const [isPreflighting, setIsPreflighting] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  
  // Feature State
  const [checkedImprovements, setCheckedImprovements] = useState<Set<string>>(new Set());
  const [upgrades, setUpgrades] = useState<{ [slot: string]: { result: { tradeUrl: string, explanation: string } | null, isLoading: boolean, error: string | null } }>({});
  const [lootFilter, setLootFilter] = useState<LootFilter | null>(null);
  const [isGeneratingFilter, setIsGeneratingFilter] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [levelingPlan, setLevelingPlan] = useState<LevelingPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [tuningResult, setTuningResult] = useState<TuningResult | null>(null);
  const [isTuning, setIsTuning] = useState(false);
  const [tuningError, setTuningError] = useState<string | null>(null);
  const [guideContent, setGuideContent] = useState<string | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [bossingStrategy, setBossingStrategy] = useState<BossingStrategyGuide[] | null>(null);
  const [isGeneratingBossingStrategy, setIsGeneratingBossingStrategy] = useState(false);
  const [bossingStrategyError, setBossingStrategyError] = useState<string | null>(null);
  const [progressionAlert, setProgressionAlert] = useState<ProgressionAlertData | null>(null);

  // Hooks for cross-context calls
  const chat = useChat();
  const ui = useUI();


  useEffect(() => { localStorage.setItem('poe-ai-league-context', leagueContext); }, [leagueContext]);
  useEffect(() => { localStorage.setItem('poe-ai-account-name', accountName); }, [accountName]);

  useEffect(() => {
    if (view !== 'loading') return;
    setCurrentStepIndex(0);
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= 8 - 1) { // 8 analysis steps
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [view]);
  
  useEffect(() => {
    if (analysisResult?.buildTitle) {
      const key = `poe-ai-checked-${analysisResult.buildTitle}`;
      const saved = localStorage.getItem(key);
      if (saved) setCheckedImprovements(new Set(JSON.parse(saved)));
      else setCheckedImprovements(new Set());
    }
  }, [analysisResult?.buildTitle]);
  
  const handleToggleImprovement = (id: string) => {
    if (!analysisResult?.buildTitle) return;
    const newSet = new Set(checkedImprovements);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCheckedImprovements(newSet);
    const key = `poe-ai-checked-${analysisResult.buildTitle}`;
    localStorage.setItem(key, JSON.stringify(Array.from(newSet)));
  };

  const resetState = () => {
    setView('welcome');
    setPobInput('');
    setPobUrl('');
    setAnalysisResult(null);
    setError(null);
    setIsFetchingCharacters(false);
    setCharacters([]);
    setSelectedCharacter(null);
    setIsFetchingPobData(false);
    setPreflightResult(null);
    setIsPreflighting(false);
    setPreflightError(null);
    setUpgrades({});
    setLootFilter(null);
    setFilterError(null);
    setLevelingPlan(null);
    setPlanError(null);
    setTuningResult(null);
    setTuningError(null);
    setGuideContent(null);
    setIsGeneratingGuide(false);
    setBossingStrategy(null);
    setBossingStrategyError(null);
  };
  
  const resetApp = () => {
    resetState();
    // Also needs to reset other contexts, might need a global reset function
  };

  const resetImport = () => {
    setAccountName('');
    setCharacters([]);
    setSelectedCharacter(null);
    setPobInput('');
    setPobUrl('');
    setError(null);
    setPreflightResult(null);
    setIsPreflighting(false);
    setPreflightError(null);
  };

  const handleFetchCharacters = useCallback(async () => {
    if (!accountName.trim()) { setError("Please enter an account name."); return; }
    // Normalize common inputs like 'Name#1234' and leading '@'
    const normalizedAccount = accountName.trim().replace(/^@/, '').split('#')[0];
    setIsFetchingCharacters(true);
    setError(null);
    setCharacters([]);
    setSelectedCharacter(null);
    setPreflightResult(null);
    setPreflightError(null); 
    try {
      const fetchedCharacters = await apiClient.getAccountCharacters(normalizedAccount);
      if (fetchedCharacters.length === 0) {
        setError(`No characters found for account "${normalizedAccount}". Make sure the profile and character tabs are set to public on pathofexile.com.`);
      }
      setCharacters(fetchedCharacters);
    } catch (err: any) {
      logService.error("Failed to fetch characters.", { error: err });
      setError(err.message || 'An unknown error occurred while fetching characters.');
    } finally {
      setIsFetchingCharacters(false);
    }
  }, [accountName]);

  const handleSelectCharacter = useCallback((character: PoeCharacter) => {
    setSelectedCharacter(character);
    setPobInput('');
    setPobUrl('');
    setPreflightResult(null);
    setIsPreflighting(false);
    setPreflightError(null);
    setError(null);
  }, []);

  const handlePreflightCheck = useCallback(async (data?: string) => {
    const pobData = data || pobInput;
    if (!pobData.trim()) return;
    setIsPreflighting(true);
    setPreflightError(null);
    setPreflightResult(null);
    try {
      const result = await apiClient.preflightCheckPob(pobData);
      setPreflightResult(result);
    } catch (err: any) {
      logService.error("handlePreflightCheck failed", { error: err });
      setPreflightError("AI could not read this build data. It might be invalid or malformed.");
    } finally {
      setIsPreflighting(false);
    }
  }, [pobInput]);

  const handleCharacterAnalysis = useCallback(async (account: string, character: string) => {
    setIsFetchingPobData(true);
    setError(null);
    setPreflightError(null);
    setPreflightResult(null);
    logService.info("Fetching PoB data for character", { account, character });
    try {
        const normalizedAccount = account.trim().replace(/^@/, '').split('#')[0];
        const { pobData, pobUrl } = await apiClient.fetchPobFromAccount(normalizedAccount, character);
        setPobInput(pobData);
        setPobUrl(pobUrl);
        await handlePreflightCheck(pobData);
    } catch (err: any) {
        logService.error("Failed to fetch PoB data.", { error: err });
        setError(err.message || 'An unknown error occurred while importing the character.');
    } finally {
        setIsFetchingPobData(false);
    }
  }, [handlePreflightCheck]);


  const handleAnalysis = useCallback(async (onSuccess: (result: PoeAnalysisResult) => void) => {
    if (!pobInput.trim() || !pobUrl.trim()) {
      setError('PoB data and URL are required.');
      return;
    }
    setView('loading');
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await apiClient.analyzePob(pobInput, pobUrl, leagueContext, analysisGoal);
      setAnalysisResult(result);
      setView('dashboard');
      onSuccess(result);
    } catch (err) {
      logService.error("handleAnalysis failed.", { error: err });
      setError('Failed to analyze the build. The AI may be experiencing high traffic or the build data is unusual.');
      setView('error');
    }
  }, [leagueContext, pobInput, pobUrl, analysisGoal]);
  
  const handleFindUpgrade = useCallback(async (slot: string, budget: string) => {
    if (!pobInput) return;
    setUpgrades(prev => ({ ...prev, [slot]: { result: null, isLoading: true, error: null } }));
    try {
        const result = await apiClient.findUpgrade(pobInput, slot, budget, leagueContext);
        setUpgrades(prev => ({ ...prev, [slot]: { result, isLoading: false, error: null } }));
    } catch (err) {
        logService.error("handleFindUpgrade failed", { slot, budget, error: err });
        const errorMsg = `Upgrade search failed. ${(err as Error).message}`;
        setUpgrades(prev => ({ ...prev, [slot]: { result: null, isLoading: false, error: errorMsg } }));
    }
  }, [pobInput, leagueContext]);

  const handleGenerateLootFilter = useCallback(async () => {
    if (!analysisResult) return;
    setIsGeneratingFilter(true);
    setFilterError(null);
    setLootFilter(null);
    try {
        const filter = await apiClient.generateLootFilter(analysisResult, leagueContext);
        setLootFilter(filter);
    } catch (err) {
        logService.error("handleGenerateLootFilter failed", { error: err });
        setFilterError(`Failed to generate loot filter. ${(err as Error).message}`);
    } finally {
        setIsGeneratingFilter(false);
    }
  }, [analysisResult, leagueContext]);

  const handleGenerateLevelingPlan = useCallback(async () => {
    if (!pobInput) return;
    setIsGeneratingPlan(true);
    setPlanError(null);
    setLevelingPlan(null);
    try {
        const plan = await apiClient.generateLevelingPlan(pobInput, leagueContext);
        setLevelingPlan(plan);
    } catch (err) {
        logService.error("handleGenerateLevelingPlan failed", { error: err });
        setPlanError(`Failed to generate leveling plan. ${(err as Error).message}`);
    } finally {
        setIsGeneratingPlan(false);
    }
  }, [pobInput, leagueContext]);

  const handleTuneBuild = useCallback(async (goal: TuningGoal) => {
    if (!analysisResult) return;
    setIsTuning(true);
    setTuningError(null);
    setTuningResult(null);
    try {
        const result = await apiClient.tuneBuildForContent(analysisResult, goal, leagueContext);
        setTuningResult(result);
    } catch (err) {
        logService.error("handleTuneBuild failed", { error: err });
        setTuningError(`Failed to tune build. ${(err as Error).message}`);
    } finally {
        setIsTuning(false);
    }
  }, [analysisResult, leagueContext]);
  
  const handleGenerateGuide = useCallback(async () => {
    if (!analysisResult) return;
    setIsGeneratingGuide(true);
    try {
        const guide = await apiClient.generateBuildGuide(analysisResult);
        setGuideContent(guide);
    } catch (err) {
        logService.error("handleGenerateGuide failed", { error: err });
        setGuideContent("Sorry, there was an error generating the build guide.");
    } finally {
        setIsGeneratingGuide(false);
    }
  }, [analysisResult]);
  
  const handleGenerateBossingStrategy = useCallback(async () => {
    if (!analysisResult) return;
    setIsGeneratingBossingStrategy(true);
    setBossingStrategyError(null);
    try {
        const strategy = await apiClient.generateBossingStrategy(analysisResult);
        setBossingStrategy(strategy);
    } catch (err) {
        logService.error("handleGenerateBossingStrategy failed", { error: err });
        setBossingStrategyError(`Failed to generate bossing strategy. ${(err as Error).message}`);
    } finally {
        setIsGeneratingBossingStrategy(false);
    }
  }, [analysisResult]);

  const clearProgressionAlert = () => {
    setProgressionAlert(null);
  }

  const loadSnapshotAndCheckProgression = useCallback((snapshotToLoad: AnalysisSnapshot, fullHistory: AnalysisSnapshot[]) => {
      const historyWithoutCurrent = fullHistory.filter(s => s.id !== snapshotToLoad.id);
      const previousSnapshot = historyWithoutCurrent
          .filter(s => s.characterName === snapshotToLoad.characterName && s.timestamp < snapshotToLoad.timestamp)
          .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (previousSnapshot) {
          const currentStats = snapshotToLoad.result.keyStats;
          const prevStats = previousSnapshot.result.keyStats;
          const alertData: ProgressionAlertData = {
              offenseChange: currentStats.offenseScore - prevStats.offenseScore,
              defenseChange: currentStats.defenseScore - prevStats.defenseScore,
              speedChange: currentStats.speedScore - prevStats.speedScore,
              milestones: [],
          };
          if (prevStats.defenseScore < 75 && currentStats.defenseScore >= 75) {
              alertData.milestones.push("Milestone Unlocked: Defensive Fortress! (Defense Score > 75)");
          }
          if (prevStats.offenseScore < 75 && currentStats.offenseScore >= 75) {
              alertData.milestones.push("Milestone Unlocked: Offensive Powerhouse! (Offense Score > 75)");
          }
           if (prevStats.speedScore < 75 && currentStats.speedScore >= 75) {
              alertData.milestones.push("Milestone Unlocked: Clear Speed Champion! (Speed Score > 75)");
          }
          if (alertData.offenseChange > 0 || alertData.defenseChange > 0 || alertData.speedChange > 0 || alertData.milestones.length > 0) {
            setProgressionAlert(alertData);
          } else {
            setProgressionAlert(null);
          }
      } else {
          setProgressionAlert(null);
      }
      
      setAnalysisResult(snapshotToLoad.result);
      chat?.initializeChat(snapshotToLoad.result);
      setView('dashboard');
      ui?.hideHistory();
  }, [chat, ui]);


  const value = {
    view,
    pobInput,
    pobUrl,
    leagueContext,
    analysisGoal,
    analysisResult,
    error,
    currentStepIndex,
    isAnalyzing: view === 'loading', // Add isAnalyzing to the value object
    isFetchingCharacters,
    characters,
    selectedCharacter,
    accountName,
    isFetchingPobData,
    preflightResult,
    isPreflighting,
    preflightError,
    checkedImprovements,
    upgrades,
    lootFilter,
    isGeneratingFilter,
    filterError,
    levelingPlan,
    isGeneratingPlan,
    planError,
    tuningResult,
    isTuning,
    tuningError,
    guideContent,
    isGeneratingGuide,
    bossingStrategy,
    isGeneratingBossingStrategy,
    bossingStrategyError,
    progressionAlert,
    setPobInput,
    setPobUrl,
    setLeagueContext,
    setAnalysisGoal,
    setAccountName,
    setAnalysisResult,
    setView,
    handleFetchCharacters,
    handleCharacterAnalysis,
    handleSelectCharacter,
    resetImport,
    handleAnalysis,
    handlePreflightCheck,
    handleToggleImprovement,
    handleFindUpgrade,
    handleGenerateLootFilter,
    handleGenerateLevelingPlan,
    handleTuneBuild,
    handleGenerateGuide,
    handleGenerateBossingStrategy,
    loadSnapshotAndCheckProgression,
    clearProgressionAlert,
    resetAnalysis: resetApp,
  };

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
};