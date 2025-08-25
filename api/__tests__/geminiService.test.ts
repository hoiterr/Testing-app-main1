import { analyzePob, preflightCheckPob, generateLootFilter } from '../geminiService';
import { ValidationError } from '../errors/apiErrors';
import * as logService from '../logService';

// Mock the logger to prevent actual logging during tests
jest.mock('../logService', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock the AI client
jest.mock('@google/generative-ai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        text: jest.fn().mockReturnValue(JSON.stringify({
          buildOverview: {
            className: 'Witch',
            ascendancy: 'Necromancer',
            mainSkill: 'Summon Raging Spirit',
            playstyle: 'Minion',
            damageType: ['Fire', 'Physical'],
            defenseLayers: ['Block', 'Armor']
          },
          strengths: ['High minion damage', 'Good clear speed'],
          weaknesses: ['Single target damage', 'Minion survivability'],
          recommendations: {
            highPriority: ['Get +2 minion helmet', 'Upgrade flasks'],
            mediumPriority: ['Improve cluster jewels', 'Optimize auras'],
            lowPriority: ['Min-max gear', 'Upgrade awakened gems']
          }
        }))
      })
    })
  }))
}));

describe('geminiService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('preflightCheckPob', () => {
    it('should validate input parameters', async () => {
      await expect(preflightCheckPob('')).rejects.toThrow(ValidationError);
      expect(logService.error).toHaveBeenCalled();
    });

    it('should return a valid analysis result', async () => {
      const result = await preflightCheckPob('valid-pob-data');
      expect(result).toBeDefined();
      expect(result.characterClass).toBe('Witch');
      expect(logService.info).toHaveBeenCalled();
    });
  });

  describe('analyzePob', () => {
    const mockPobData = 'valid-pob-data';
    const mockPobUrl = 'https://pobb.in/abc123';
    const mockLeagueContext = 'Standard';
    const mockAnalysisGoal = 'Bossing';

    it('should validate input parameters', async () => {
      // Test empty pobData
      await expect(analyzePob('', mockPobUrl, mockLeagueContext, mockAnalysisGoal))
        .rejects.toThrow(ValidationError);

      // Test invalid pobUrl type
      await expect(analyzePob(mockPobData, 123 as any, mockLeagueContext, mockAnalysisGoal))
        .rejects.toThrow(ValidationError);

      // Test empty leagueContext
      await expect(analyzePob(mockPobData, mockPobUrl, '', mockAnalysisGoal))
        .rejects.toThrow(ValidationError);

      // Test invalid analysisGoal
      await expect(analyzePob(mockPobData, mockPobUrl, mockLeagueContext, 'InvalidGoal' as any))
        .rejects.toThrow(ValidationError);
    });

    it('should return a valid analysis result', async () => {
      const result = await analyzePob(mockPobData, mockPobUrl, mockLeagueContext, mockAnalysisGoal);
      
      expect(result).toBeDefined();
      expect(result.buildOverview.className).toBe('Witch');
      expect(result.buildOverview.ascendancy).toBe('Necromancer');
      expect(result.strengths).toContain('High minion damage');
      expect(result.weaknesses).toContain('Single target damage');
      expect(result.recommendations.highPriority).toContain('Get +2 minion helmet');
    });
  });

  describe('generateLootFilter', () => {
    const mockAnalysis = {
      buildOverview: {
        className: 'Witch',
        ascendancy: 'Necromancer',
        mainSkill: 'Summon Raging Spirit',
        playstyle: 'Minion',
        damageType: ['Fire', 'Physical'],
        defenseLayers: ['Block', 'Armor']
      },
      gear: {
        weapons: ['Convoking Wand'],
        bodyArmour: 'Bone Helmet',
        helmet: 'Bone Helmet',
        gloves: 'Gripped Gloves',
        boots: 'Two-Toned Boots',
        belt: 'Stygian Vise',
        amulet: 'Onyx Amulet',
        rings: ['Vermillion Ring', 'Opal Ring'],
        flasks: ['Quartz Flask', 'Granite Flask'],
        jewels: ['Ghastly Eye Jewel', 'Cluster Jewel']
      }
    };

    it('should generate a loot filter based on build analysis', async () => {
      const result = await generateLootFilter(JSON.stringify(mockAnalysis), 'Standard');
      
      expect(result).toBeDefined();
      expect(result.script).toContain('Show');
      expect(result.script).toContain('Hide');
      expect(result.notes).toBeDefined();
    });
  });
});
