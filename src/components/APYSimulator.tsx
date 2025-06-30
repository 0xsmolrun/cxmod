import React, { useState } from 'react';
import { TrendingUp, ArrowRight, Calculator, RotateCcw, ArrowLeft, Percent, Calendar, DollarSign } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface SimulationData {
  asset1Initial: string;
  amount1Initial: string;
  asset2Initial: string;
  amount2Initial: string;
  startBlock: string;
  asset1Final: string;
  amount1Final: string;
  asset2Final: string;
  amount2Final: string;
  fixedYieldAPY: string;
  restakingAPY: string;
  depositStatus: 'vault' | 'withdrew';
  currentExchangeRate: string;
}

interface CalculationResult {
  exchangeRateInitial: number;
  exchangeRateFinal: number;
  numberOfDays: number;
  variableYieldAPY: number;
  fixedYieldAPY: number;
  restakingAPY: number;
  totalAPY: number;
  formula: string;
}

const ASSET1_OPTIONS = [
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

const ASSET2_OPTIONS = [
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
  { value: 'vault', label: 'Deposit Still in the Vault' },
  { value: 'withdrew', label: 'Withdrew' }
];

const BLOCKS_PER_DAY = 7200; // Approximate blocks per day on Ethereum

export const APYSimulator: React.FC = () => {
  const [formData, setFormData] = useState<SimulationData>({
    asset1Initial: 'WETH',
    amount1Initial: '',
    asset2Initial: 'liquidETH',
    amount2Initial: '',
    startBlock: '',
    asset1Final: 'WETH',
    amount1Final: '',
    asset2Final: 'liquidETH',
    amount2Final: '',
    fixedYieldAPY: '',
    restakingAPY: '',
    depositStatus: 'vault',
    currentExchangeRate: ''
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const updateField = (field: keyof SimulationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateAPY = (): CalculationResult => {
    const amount1Initial = parseFloat(formData.amount1Initial);
    const amount2Initial = parseFloat(formData.amount2Initial);
    const startBlock = parseInt(formData.startBlock);
    const fixedYieldAPY = parseFloat(formData.fixedYieldAPY);
    const restakingAPY = parseFloat(formData.restakingAPY);

    // Calculate initial exchange rate
    let exchangeRateInitial: number;
    if (amount1Initial > amount2Initial) {
      exchangeRateInitial = amount1Initial / amount2Initial;
    } else {
      exchangeRateInitial = amount2Initial / amount1Initial;
    }

    // Calculate final exchange rate
    let exchangeRateFinal: number;
    if (formData.depositStatus === 'vault') {
      exchangeRateFinal = parseFloat(formData.currentExchangeRate);
    } else {
      const amount1Final = parseFloat(formData.amount1Final);
      const amount2Final = parseFloat(formData.amount2Final);
      
      if (amount1Final > amount2Final) {
        exchangeRateFinal = amount1Final / amount2Final;
      } else {
        exchangeRateFinal = amount2Final / amount1Final;
      }
    }

    // Calculate number of days (assuming current block for end if still in vault)
    const currentBlock = 21200000; // Approximate current block (you can update this)
    const endBlock = formData.depositStatus === 'vault' ? currentBlock : Math.max(parseInt(formData.amount1Final) || 0, parseInt(formData.amount2Final) || 0);
    const numberOfDays = (endBlock - startBlock) / BLOCKS_PER_DAY;

    // Calculate variable yield APY
    const variableYieldAPY = ((exchangeRateFinal / exchangeRateInitial) - 1) / numberOfDays * 365 * 100;

    // Calculate total APY
    const totalAPY = variableYieldAPY + fixedYieldAPY + restakingAPY;

    const formula = `((${exchangeRateFinal.toFixed(6)} / ${exchangeRateInitial.toFixed(6)}) - 1) / ${numberOfDays.toFixed(2)} × 365 × 100 + ${fixedYieldAPY}% + ${restakingAPY}%`;

    return {
      exchangeRateInitial: Math.round(exchangeRateInitial * 1000000) / 1000000,
      exchangeRateFinal: Math.round(exchangeRateFinal * 1000000) / 1000000,
      numberOfDays: Math.round(numberOfDays * 100) / 100,
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
      'amount1Initial', 'amount2Initial', 'startBlock', 'fixedYieldAPY', 'restakingAPY'
    ];

    const missingFields = requiredFields.filter(field => !formData[field as keyof SimulationData]);

    if (formData.depositStatus === 'vault' && !formData.currentExchangeRate) {
      missingFields.push('currentExchangeRate');
    }

    if (formData.depositStatus === 'withdrew' && (!formData.amount1Final || !formData.amount2Final)) {
      missingFields.push('amount1Final', 'amount2Final');
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
      asset1Initial: 'WETH',
      amount1Initial: '',
      asset2Initial: 'liquidETH',
      amount2Initial: '',
      startBlock: '',
      asset1Final: 'WETH',
      amount1Final: '',
      asset2Final: 'liquidETH',
      amount2Final: '',
      fixedYieldAPY: '',
      restakingAPY: '',
      depositStatus: 'vault',
      currentExchangeRate: ''
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

          {/* Exchange Rate Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {result.exchangeRateInitial.toFixed(6)}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Exchange Rate Initial
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {result.exchangeRateFinal.toFixed(6)}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Exchange Rate Final
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {result.numberOfDays} days
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Assets</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formData.asset1Initial}: {parseFloat(formData.amount1Initial).toLocaleString()}
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formData.asset2Initial}: {parseFloat(formData.amount2Initial).toLocaleString()}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Final Assets</div>
                {formData.depositStatus === 'vault' ? (
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    Still in vault
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formData.asset1Final}: {parseFloat(formData.amount1Final).toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formData.asset2Final}: {parseFloat(formData.amount2Final).toLocaleString()}
                    </div>
                  </>
                )}
              </div>
              
              <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Status</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formData.depositStatus === 'vault' ? 'In Vault' : 'Withdrew'}
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
              <li>• Exchange rates are calculated based on asset amount ratios</li>
              <li>• Variable yield reflects the change in exchange rate over time</li>
              <li>• Fixed yield and restaking APY are added to the variable component</li>
              <li>• Approximately {BLOCKS_PER_DAY.toLocaleString()} blocks per day on Ethereum</li>
              <li>• Results are annualized (multiplied by 365 days)</li>
              <li>• All calculations are rounded to 2 decimal places for precision</li>
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
        {/* Initial Assets */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Initial Assets
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Select
                label="Asset 1 Initial"
                value={formData.asset1Initial}
                onChange={(value) => updateField('asset1Initial', value)}
                options={ASSET1_OPTIONS}
              />
              <Input
                label="Asset 1 Amount"
                type="number"
                value={formData.amount1Initial}
                onChange={(value) => updateField('amount1Initial', value)}
                placeholder="0.00"
                step="0.000001"
                required
              />
            </div>
            
            <div className="space-y-4">
              <Select
                label="Asset 2 Initial"
                value={formData.asset2Initial}
                onChange={(value) => updateField('asset2Initial', value)}
                options={ASSET2_OPTIONS}
              />
              <Input
                label="Asset 2 Amount"
                type="number"
                value={formData.amount2Initial}
                onChange={(value) => updateField('amount2Initial', value)}
                placeholder="0.00"
                step="0.000001"
                required
              />
            </div>
          </div>
        </div>

        {/* Deposit Period */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Deposit Period
          </h3>
          
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deposit Status</h3>
          
          <Select
            value={formData.depositStatus}
            onChange={(value) => updateField('depositStatus', value)}
            options={DEPOSIT_STATUS_OPTIONS}
          />
        </div>

        {/* Conditional Fields Based on Deposit Status */}
        {formData.depositStatus === 'vault' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Exchange Rate</h3>
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
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Final Assets (After Withdrawal)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <Select
                  label="Asset 1 Final"
                  value={formData.asset1Final}
                  onChange={(value) => updateField('asset1Final', value)}
                  options={ASSET1_OPTIONS}
                />
                <Input
                  label="Asset 1 Final Amount"
                  type="number"
                  value={formData.amount1Final}
                  onChange={(value) => updateField('amount1Final', value)}
                  placeholder="0.00"
                  step="0.000001"
                  required
                />
              </div>
              
              <div className="space-y-4">
                <Select
                  label="Asset 2 Final"
                  value={formData.asset2Final}
                  onChange={(value) => updateField('asset2Final', value)}
                  options={ASSET2_OPTIONS}
                />
                <Input
                  label="Asset 2 Final Amount"
                  type="number"
                  value={formData.amount2Final}
                  onChange={(value) => updateField('amount2Final', value)}
                  placeholder="0.00"
                  step="0.000001"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* APY Components */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Percent className="w-5 h-5 text-purple-400" />
            APY Components
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
            <li>• <strong>Exchange Rate:</strong> Calculated as the ratio between asset amounts</li>
            <li>• <strong>Variable Yield:</strong> Based on the change in exchange rate over time</li>
            <li>• <strong>Fixed Yield:</strong> Guaranteed yield component (e.g., staking rewards)</li>
            <li>• <strong>Restaking APY:</strong> Additional rewards from restaking protocols</li>
            <li>• <strong>Total APY:</strong> Sum of all three components, annualized</li>
            <li>• <strong>Vault Status:</strong> Choose whether you're still deposited or have withdrawn</li>
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