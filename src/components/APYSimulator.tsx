import React, { useState } from 'react';
import { TrendingUp, ArrowRight, Calculator, RotateCcw, ArrowLeft, Percent, Calendar, DollarSign } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface SimulationData {
  // Initial deposit
  initialAsset: string;
  initialAmount: string;
  startBlock: string;
  
  // Final state
  depositStatus: 'vault' | 'withdrew';
  endBlock: string; // For withdrew status
  endBlock: string; // For withdrew status
  
  // Final amounts (for withdrew) or current exchange rate (for vault)
  finalAsset: string;
  finalAmount: string;
  currentExchangeRate: string; // For vault status
  
  // APY components
  fixedYieldAPY: string;
  restakingAPY: string;
}

interface CalculationResult {
  initialAsset: string;
  initialAmount: number;
  finalAsset: string;
  finalAmount: number;
  startBlock: number;
  endBlock: number;
  endBlock: number;
  numberOfDays: number;
  exchangeRateInitial: number;
  exchangeRateFinal: number;
  variableYieldAPY: number;
  fixedYieldAPY: number;
  restakingAPY: number;
  totalAPY: number;
  formula: string;
}

const ASSET_OPTIONS = [
  { value: 'cbBTC', label: 'cbBTC' },
  { value: 'DAI', label: 'DAI' },
  { value: 'eBTC', label: 'eBTC' },
  { value: 'eETH', label: 'eETH' },
  { value: 'EIGEN', label: 'EIGEN' },
  { value: 'ETH', label: 'ETH' },
  { value: 'ETHFI', label: 'ETHFI' },
  { value: 'LBTC', label: 'LBTC' },
  { value: 'stETH', label: 'stETH' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
  { value: 'wBTC', label: 'wBTC' },
  { value: 'weETH', label: 'weETH' },
  { value: 'WETH', label: 'WETH' },
  { value: 'wstETH', label: 'wstETH' }
];

const LIQUID_ASSET_OPTIONS = [
  { value: 'eEIGEN', label: 'eEIGEN' },
  { value: 'liquidBeraETH', label: 'liquidBeraETH' },
  { value: 'liquidBeraBTC', label: 'liquidBeraBTC' },
  { value: 'liquidBTC', label: 'liquidBTC' },
  { value: 'liquidETH', label: 'liquidETH' },
  { value: 'liquidMoveETH', label: 'liquidMoveETH' },
  { value: 'liquidUltraUSD', label: 'liquidUltraUSD' },
  { value: 'liquidUSD', label: 'liquidUSD' },
  { value: 'sETHFI', label: 'sETHFI' }
];

const DEPOSIT_STATUS_OPTIONS = [
  { value: 'vault', label: 'Still in Vault' },
  { value: 'withdrew', label: 'Withdrew' }
];

const BLOCKS_PER_DAY = 7200; // Approximate blocks per day on Ethereum

export const APYSimulator: React.FC = () => {
  const [formData, setFormData] = useState<SimulationData>({
    initialAsset: 'WETH',
    initialAmount: '',
    startBlock: '',
    depositStatus: 'vault',
    endBlock: '',
    endBlock: '',
    finalAsset: 'liquidETH',
    finalAmount: '',
    currentExchangeRate: '',
    fixedYieldAPY: '',
    restakingAPY: ''
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const updateField = (field: keyof SimulationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateAPY = (): CalculationResult => {
    const initialAmount = parseFloat(formData.initialAmount);
    const startBlock = parseInt(formData.startBlock);
    const fixedYieldAPY = parseFloat(formData.fixedYieldAPY);
    const restakingAPY = parseFloat(formData.restakingAPY);

    let endBlock: number;
    let finalAmount: number;
    let exchangeRateFinal: number;

    if (formData.depositStatus === 'vault') {
      // Still in vault - use current block and exchange rate
      const currentBlock = 21200000; // Approximate current block
      endBlock = currentBlock;
      exchangeRateFinal = parseFloat(formData.currentExchangeRate);
      finalAmount = initialAmount * exchangeRateFinal;
    } else {
      // Withdrew - use provided end block and final amount
      endBlock = parseInt(formData.endBlock);
      finalAmount = parseFloat(formData.finalAmount);
      exchangeRateFinal = finalAmount / initialAmount;
    }

    // Calculate number of days
    const numberOfDays = (endBlock - startBlock) / BLOCKS_PER_DAY;

    // Initial exchange rate is always 1 (starting point)
    const exchangeRateInitial = 1;

    // Calculate variable yield APY
    const variableYieldAPY = ((exchangeRateFinal / exchangeRateInitial) - 1) / numberOfDays * 365 * 100;

    // Calculate total APY
    const totalAPY = variableYieldAPY + fixedYieldAPY + restakingAPY;

    const formula = `((${exchangeRateFinal.toFixed(6)} / ${exchangeRateInitial.toFixed(6)}) - 1) / ${numberOfDays.toFixed(2)} × 365 × 100 + ${fixedYieldAPY}% + ${restakingAPY}%`;

    return {
      initialAsset: formData.initialAsset,
      initialAmount,
      finalAsset: formData.finalAsset,
      finalAmount,
      startBlock,
      endBlock,
      endBlock,
      numberOfDays: Math.round(numberOfDays * 100) / 100,
      exchangeRateInitial: Math.round(exchangeRateInitial * 1000000) / 1000000,
      exchangeRateFinal: Math.round(exchangeRateFinal * 1000000) / 1000000,
      variableYieldAPY: Math.round(variableYieldAPY * 100) / 100,
      fixedYieldAPY,
      restakingAPY,
      totalAPY: Math.round(totalAPY * 100) / 100,
      formula
    };
  };

  const handleCalculate = async () => {
    // Validation
    const requiredFields = [
      'initialAmount', 'startBlock', 'fixedYieldAPY', 'restakingAPY'
    ];

    const missingFields = requiredFields.filter(field => !formData[field as keyof SimulationData]);

    if (formData.depositStatus === 'vault' && !formData.currentExchangeRate) {
      missingFields.push('currentExchangeRate');
    }

    if (formData.depositStatus === 'withdrew') {
      if (!formData.endBlock) missingFields.push('endBlock');
      if (!formData.finalAmount) missingFields.push('finalAmount');
    }

    if (missingFields.length > 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    const calculationResult = calculateAPY();
    setResult(calculationResult);
    setShowResults(true);
    setIsCalculating(false);
  };

  const handleReset = () => {
    setShowResults(false);
    setResult(null);
    setFormData({
      initialAsset: 'WETH',
      initialAmount: '',
      startBlock: '',
      depositStatus: 'vault',
      endBlock: '',
      endBlock: '',
      finalAsset: 'liquidETH',
      finalAmount: '',
      currentExchangeRate: '',
      fixedYieldAPY: '',
      restakingAPY: ''
    });
  };

  const handleBack = () => {
    setShowResults(false);
  };

  if (showResults && result) {
    return (
      <div className="space-y-6 min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-green-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">APY Simulator</h2>
        </div>

        <GlassCard className="space-y-8">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-green-400" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Simulation Results</h3>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                icon={ArrowLeft}
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-400 flex-1 sm:flex-none"
              >
                Back to Edit
              </Button>
              <Button
                variant="ghost"
                icon={RotateCcw}
                onClick={handleReset}
                className="text-gray-600 dark:text-gray-400 flex-1 sm:flex-none"
              >
                New Simulation
              </Button>
            </div>
          </div>

          {/* Total APY Summary */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-200 dark:border-green-800 rounded-xl p-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-green-600 dark:text-green-400 mb-3">
                {result.totalAPY.toFixed(2)}%
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-300">
                {result.numberOfDays}-Day Trailing APY
              </div>
            </div>
          </div>

          {/* Asset Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Initial Deposit
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {result.initialAmount.toLocaleString()} {result.initialAsset}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Block: {result.startBlock.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  {formData.depositStatus === 'vault' ? 'Current Value' : 'Final Value'}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {result.finalAmount.toLocaleString()} {result.finalAsset}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Block: {result.endBlock.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rate Summary */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Exchange Rate Growth
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.exchangeRateInitial.toFixed(6)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Initial</div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.exchangeRateFinal.toFixed(6)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Final</div>
                </div>
              </div>
            </div>
          </div>

          {/* APY Breakdown */}
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Percent className="w-6 h-6 text-green-400" />
              APY Breakdown
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Variable Yield APY */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    V
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {result.variableYieldAPY.toFixed(2)}%
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
                    Variable Yield APY
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Based on exchange rate change
                  </div>
                </div>
              </div>

              {/* Fixed Yield APY */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    F
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {result.fixedYieldAPY.toFixed(2)}%
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
                    Fixed Yield APY
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Guaranteed yield component
                  </div>
                </div>
              </div>

              {/* Restaking APY */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    R
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {result.restakingAPY.toFixed(2)}%
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
                    Restaking APY
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Additional restaking rewards
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation Details */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 space-y-4">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Calculation Details
            </h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {result.numberOfDays} days
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Status</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formData.depositStatus === 'vault' ? 'Still in Vault' : 'Withdrew'}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Block Range</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {result.startBlock.toLocaleString()} → {result.endBlock.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Formula Display */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 text-lg">Calculation Formula</h5>
            <div className="font-mono text-sm text-blue-700 dark:text-blue-300 break-all bg-white dark:bg-blue-900/30 p-4 rounded-lg">
              Variable Yield APY = {result.formula}
            </div>
            <div className="mt-3 text-sm text-blue-700 dark:text-blue-300">
              Total APY = Variable Yield APY + Fixed Yield APY + Restaking APY = {result.totalAPY.toFixed(2)}%
            </div>
          </div>

          {/* Calculation Info */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <h5 className="font-semibold text-green-800 dark:text-green-300 mb-3 text-lg">Simulation Notes</h5>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• Single asset deposit with clear start and end points</li>
              <li>• Variable yield reflects the growth in asset value over time</li>
              <li>• Fixed yield and restaking APY are added to the variable component</li>
              <li>• For "Still in Vault": Uses current exchange rate and estimated current block</li>
              <li>• For "Withdrew": Uses actual withdrawal block and final amount</li>
              <li>• Approximately {BLOCKS_PER_DAY.toLocaleString()} blocks per day on Ethereum</li>
              <li>• Results are annualized (multiplied by 365 days)</li>
            </ul>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-8 h-8 text-green-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">APY Simulator</h2>
      </div>

      <GlassCard className="space-y-6">
        {/* Initial Deposit */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Initial Deposit
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Initial Asset"
              value={formData.initialAsset}
              onChange={(value) => updateField('initialAsset', value)}
              options={ASSET_OPTIONS}
            />
            <Input
              label="Initial Amount"
              type="number"
              value={formData.initialAmount}
              onChange={(value) => updateField('initialAmount', value)}
              placeholder="0.00"
              step="0.000001"
              required
            />
          </div>
          
          <Input
            label="Start Block"
            type="number"
            value={formData.startBlock}
            onChange={(value) => updateField('startBlock', value)}
            placeholder="e.g., 20000000"
            required
          />
        </div>

        {/* Deposit Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Current Status
          </h3>
          
          <Select
            label="Deposit Status"
            value={formData.depositStatus}
            onChange={(value) => updateField('depositStatus', value)}
            options={DEPOSIT_STATUS_OPTIONS}
          />
        </div>

        {/* Conditional Fields Based on Status */}
        {formData.depositStatus === 'vault' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Vault Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Current Asset Type"
                value={formData.finalAsset}
                onChange={(value) => updateField('finalAsset', value)}
                options={LIQUID_ASSET_OPTIONS}
              />
              <Input
                label="Current Exchange Rate"
                type="number"
                value={formData.currentExchangeRate}
                onChange={(value) => updateField('currentExchangeRate', value)}
                placeholder="e.g., 1.05"
                step="0.000001"
                required
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Exchange Rate:</strong> How much your initial asset has grown. For example, if you deposited 1 WETH and it's now worth 1.05 liquidETH, enter 1.05.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Withdrawal Details</h3>
            
            <Input
              label="End Block (Withdrawal Block)"
              type="number"
              value={formData.endBlock}
              onChange={(value) => updateField('endBlock', value)}
              placeholder="e.g., 21000000"
              required
            />
            
            <Input
              label="End Block (Withdrawal Block)"
              type="number"
              value={formData.endBlock}
              onChange={(value) => updateField('endBlock', value)}
              placeholder="e.g., 21000000"
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Final Asset Type"
                value={formData.finalAsset}
                onChange={(value) => updateField('finalAsset', value)}
                options={LIQUID_ASSET_OPTIONS}
              />
              <Input
                label="Final Amount Received"
                type="number"
                value={formData.finalAmount}
                onChange={(value) => updateField('finalAmount', value)}
                placeholder="0.00"
                step="0.000001"
                required
              />
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                <strong>Final Amount:</strong> The actual amount you received when you withdrew from the vault.
              </p>
            </div>
          </div>
        )}

        {/* APY Components */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Percent className="w-5 h-5 text-purple-400" />
            Additional APY Components
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fixed Yield APY (%)"
              type="number"
              value={formData.fixedYieldAPY}
              onChange={(value) => updateField('fixedYieldAPY', value)}
              placeholder="e.g., 5.0"
              step="0.01"
              required
            />
            <Input
              label="Restaking APY (%)"
              type="number"
              value={formData.restakingAPY}
              onChange={(value) => updateField('restakingAPY', value)}
              placeholder="e.g., 3.0"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Information Card */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 text-lg">How It Works</h4>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
            <li>• <strong>Single Asset Tracking:</strong> Track one asset from deposit to current state or withdrawal</li>
            <li>• <strong>Variable Yield:</strong> Calculated from the growth in asset value over time</li>
            <li>• <strong>Still in Vault:</strong> Uses current exchange rate to estimate current value</li>
            <li>• <strong>Withdrew:</strong> Uses actual withdrawal data for precise calculation</li>
            <li>• <strong>Fixed Yield:</strong> Additional guaranteed yield (e.g., staking rewards)</li>
            <li>• <strong>Restaking APY:</strong> Extra rewards from restaking protocols</li>
            <li>• <strong>Total APY:</strong> Sum of all components, annualized to yearly percentage</li>
          </ul>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={isCalculating}
          icon={isCalculating ? undefined : Calculator}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-lg py-3"
        >
          {isCalculating ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Simulating APY...
            </div>
          ) : (
            'Simulate APY'
          )}
        </Button>
      </GlassCard>
    </div>
  );
};