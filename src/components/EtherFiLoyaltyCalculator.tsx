import React, { useState } from 'react';
import { Heart, Plus, Minus, TrendingUp, Calendar, Coins, RotateCcw, ArrowLeft, Calculator } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface AssetDeposit {
  id: string;
  asset: string;
  amount: string;
  exchangeRate: string;
  startBlock: string;
  endBlock: string;
  multiplier: string;
}

interface CalculationResult {
  asset: string;
  amount: number;
  exchangeRate: number;
  startBlock: number;
  endBlock: number;
  multiplier: number;
  days: number;
  loyaltyPoints: number;
  formula: string;
}

const ASSET_OPTIONS = [
  { value: 'eBTC', label: 'eBTC' },
  { value: 'eEIGEN', label: 'eEIGEN' },
  { value: 'eETH', label: 'eETH' },
  { value: 'eUSD', label: 'eUSD' },
  { value: 'liquidBeraETH', label: 'liquidBeraETH' },
  { value: 'liquidBeraBTC', label: 'liquidBeraBTC' },
  { value: 'liquidBTC', label: 'liquidBTC' },
  { value: 'liquidETH', label: 'liquidETH' },
  { value: 'liquidMoveETH', label: 'liquidMoveETH' },
  { value: 'liquidUltraUSD', label: 'liquidUltraUSD' },
  { value: 'liquidUSD', label: 'liquidUSD' },
  { value: 'sETHFI', label: 'sETHFI' },
  { value: 'weETH', label: 'weETH' },
  { value: 'weETHk', label: 'weETHk' },
  { value: 'weETHs', label: 'weETHs' }
];

const BLOCKS_PER_DAY = 7200; // Approximate blocks per day on Ethereum
const BASE_POINTS_PER_DAY = 10000; // 10,000 points per eETH per day

export const EtherFiLoyaltyCalculator: React.FC = () => {
  const [assetCount, setAssetCount] = useState(1);
  const [deposits, setDeposits] = useState<AssetDeposit[]>([
    { 
      id: '1', 
      asset: 'eETH', 
      amount: '', 
      exchangeRate: '1.0', 
      startBlock: '', 
      endBlock: '', 
      multiplier: '1.0' 
    }
  ]);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const updateAssetCount = (count: number) => {
    setAssetCount(count);
    const newDeposits = Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      asset: deposits[i]?.asset || 'eETH',
      amount: deposits[i]?.amount || '',
      exchangeRate: deposits[i]?.exchangeRate || (deposits[i]?.asset === 'eETH' ? '1.0' : ''),
      startBlock: deposits[i]?.startBlock || '',
      endBlock: deposits[i]?.endBlock || '',
      multiplier: deposits[i]?.multiplier || '1.0'
    }));
    setDeposits(newDeposits);
  };

  const updateDeposit = (id: string, field: keyof AssetDeposit, value: string) => {
    setDeposits(prev => prev.map(deposit => {
      if (deposit.id === id) {
        const updated = { ...deposit, [field]: value };
        // Auto-set exchange rate to 1.0 for eETH
        if (field === 'asset' && value === 'eETH') {
          updated.exchangeRate = '1.0';
        }
        return updated;
      }
      return deposit;
    }));
  };

  const calculateLoyaltyPoints = (
    asset: string,
    amount: number,
    exchangeRate: number,
    startBlock: number,
    endBlock: number,
    multiplier: number
  ): CalculationResult => {
    const blocks = endBlock - startBlock;
    const days = blocks / BLOCKS_PER_DAY;
    
    let loyaltyPoints: number;
    let formula: string;
    
    if (asset === 'eETH') {
      // For eETH: amount * days * 10,000 * multiplier
      loyaltyPoints = amount * days * BASE_POINTS_PER_DAY * multiplier;
      formula = `${amount} × ${days.toFixed(2)} days × ${BASE_POINTS_PER_DAY.toLocaleString()} × ${multiplier}`;
    } else {
      // For other assets: amount * exchangeRate * days * 10,000 * multiplier
      loyaltyPoints = amount * exchangeRate * days * BASE_POINTS_PER_DAY * multiplier;
      formula = `${amount} × ${exchangeRate} × ${days.toFixed(2)} days × ${BASE_POINTS_PER_DAY.toLocaleString()} × ${multiplier}`;
    }

    return {
      asset,
      amount,
      exchangeRate,
      startBlock,
      endBlock,
      multiplier,
      days: Math.round(days * 100) / 100,
      loyaltyPoints: Math.round(loyaltyPoints * 100) / 100,
      formula
    };
  };

  const handleCalculate = async () => {
    const validDeposits = deposits.filter(d => {
      const hasAmount = d.amount && parseFloat(d.amount) > 0;
      const hasBlocks = d.startBlock && d.endBlock && parseInt(d.startBlock) < parseInt(d.endBlock);
      const hasExchangeRate = d.asset === 'eETH' || (d.exchangeRate && parseFloat(d.exchangeRate) > 0);
      const hasMultiplier = d.multiplier && parseFloat(d.multiplier) > 0;
      
      return hasAmount && hasBlocks && hasExchangeRate && hasMultiplier;
    });
    
    if (validDeposits.length === 0) {
      alert('Please enter valid amounts, block ranges, exchange rates, and multipliers for at least one asset');
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    const calculationResults = validDeposits.map(deposit => 
      calculateLoyaltyPoints(
        deposit.asset,
        parseFloat(deposit.amount),
        parseFloat(deposit.exchangeRate),
        parseInt(deposit.startBlock),
        parseInt(deposit.endBlock),
        parseFloat(deposit.multiplier)
      )
    );

    setResults(calculationResults);
    setShowResults(true);
    setIsCalculating(false);
  };

  const handleReset = () => {
    setShowResults(false);
    setResults([]);
    setAssetCount(1);
    setDeposits([{ 
      id: '1', 
      asset: 'eETH', 
      amount: '', 
      exchangeRate: '1.0', 
      startBlock: '', 
      endBlock: '', 
      multiplier: '1.0' 
    }]);
  };

  const handleBack = () => {
    setShowResults(false);
  };

  const totalPoints = results.reduce((sum, result) => sum + result.loyaltyPoints, 0);

  if (showResults) {
    return (
      <div className="space-y-6 min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-8 h-8 text-pink-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ether.fi Loyalty Points Calculator</h2>
        </div>

        <GlassCard className="space-y-8">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-pink-400" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Calculation Results</h3>
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
                New Calculation
              </Button>
            </div>
          </div>

          {/* Total Points Summary */}
          <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-200 dark:border-pink-800 rounded-xl p-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-pink-600 dark:text-pink-400 mb-3">
                {totalPoints.toLocaleString()} Points
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-300">
                Total Ether.fi Loyalty Points Earned
              </div>
            </div>
          </div>

          {/* Individual Asset Results */}
          <div className="space-y-8">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-pink-400" />
              Asset Breakdown
            </h4>
            
            {results.map((result, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 space-y-6">
                {/* Asset Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {result.asset.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {result.asset}
                      </div>
                      <div className="text-base text-gray-600 dark:text-gray-400">
                        {result.amount.toLocaleString()} tokens deposited
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500 font-mono">
                        Blocks: {result.startBlock.toLocaleString()} → {result.endBlock.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                      {result.loyaltyPoints.toLocaleString()}
                    </div>
                    <div className="text-base text-gray-600 dark:text-gray-400">
                      loyalty points
                    </div>
                  </div>
                </div>

                {/* Calculation Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {result.days} days
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {(result.endBlock - result.startBlock).toLocaleString()} blocks
                    </div>
                  </div>
                  
                  {result.asset !== 'eETH' && (
                    <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Exchange Rate</div>
                      <div className="text-xl font-semibold text-gray-900 dark:text-white">
                        {result.exchangeRate}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {result.asset}/eETH
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Multiplier</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {result.multiplier}×
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      bonus multiplier
                    </div>
                  </div>
                </div>

                {/* Formula Display */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="font-medium text-blue-800 dark:text-blue-300 mb-2">Calculation Formula</div>
                  <div className="font-mono text-sm text-blue-700 dark:text-blue-300 break-all">
                    {result.formula} = {result.loyaltyPoints.toLocaleString()} points
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calculation Info */}
          <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-6">
            <h5 className="font-semibold text-pink-800 dark:text-pink-300 mb-3 text-lg">Calculation Notes</h5>
            <ul className="text-sm text-pink-700 dark:text-pink-300 space-y-2">
              <li>• Base rate: 10,000 loyalty points per eETH per day</li>
              <li>• For eETH: Points = Amount × Days × 10,000 × Multiplier</li>
              <li>• For other assets: Points = Amount × Exchange Rate × Days × 10,000 × Multiplier</li>
              <li>• Exchange rates convert asset amounts to eETH equivalent</li>
              <li>• Approximately {BLOCKS_PER_DAY.toLocaleString()} blocks per day on Ethereum</li>
              <li>• Multipliers can be used for bonus periods or special campaigns</li>
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
        <Heart className="w-8 h-8 text-pink-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ether.fi Loyalty Points Calculator</h2>
      </div>

      <GlassCard className="space-y-6">
        {/* Asset Count Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Number of Assets to Calculate (1-15)
          </label>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              icon={Minus}
              onClick={() => updateAssetCount(Math.max(1, assetCount - 1))}
              disabled={assetCount <= 1}
              className="p-2"
            />
            <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[2rem] text-center">
              {assetCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              icon={Plus}
              onClick={() => updateAssetCount(Math.min(15, assetCount + 1))}
              disabled={assetCount >= 15}
              className="p-2"
            />
          </div>
        </div>

        {/* Asset Deposits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Asset Deposits</h3>
          {deposits.map((deposit, index) => (
            <div key={deposit.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Asset {index + 1}</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Asset Type"
                  value={deposit.asset}
                  onChange={(value) => updateDeposit(deposit.id, 'asset', value)}
                  options={ASSET_OPTIONS}
                />
                <Input
                  label="Deposit Amount"
                  type="number"
                  value={deposit.amount}
                  onChange={(value) => updateDeposit(deposit.id, 'amount', value)}
                  placeholder="0.00"
                  step="0.000001"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={deposit.asset === 'eETH' ? 'Exchange Rate (Fixed)' : `${deposit.asset}/eETH Exchange Rate`}
                  type="number"
                  value={deposit.exchangeRate}
                  onChange={(value) => updateDeposit(deposit.id, 'exchangeRate', value)}
                  placeholder={deposit.asset === 'eETH' ? '1.0' : 'e.g., 1.05'}
                  step="0.000001"
                  disabled={deposit.asset === 'eETH'}
                />
                <Input
                  label="Multiplier"
                  type="number"
                  value={deposit.multiplier}
                  onChange={(value) => updateDeposit(deposit.id, 'multiplier', value)}
                  placeholder="1.0"
                  step="0.1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Block"
                  type="number"
                  value={deposit.startBlock}
                  onChange={(value) => updateDeposit(deposit.id, 'startBlock', value)}
                  placeholder="e.g., 20000000"
                />
                <Input
                  label="End Block"
                  type="number"
                  value={deposit.endBlock}
                  onChange={(value) => updateDeposit(deposit.id, 'endBlock', value)}
                  placeholder="e.g., 21000000"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Information Card */}
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-6">
          <h4 className="font-semibold text-pink-800 dark:text-pink-300 mb-3 text-lg">How It Works</h4>
          <ul className="text-sm text-pink-700 dark:text-pink-300 space-y-2">
            <li>• <strong>eETH:</strong> Direct calculation - 10,000 points per token per day</li>
            <li>• <strong>Other assets:</strong> Converted to eETH equivalent using exchange rate</li>
            <li>• <strong>Exchange Rate:</strong> How many eETH each token is worth (e.g., 1.05 means 1 token = 1.05 eETH)</li>
            <li>• <strong>Multiplier:</strong> Bonus multiplier for special campaigns or periods</li>
            <li>• <strong>Block Range:</strong> Deposit period using Ethereum block numbers</li>
          </ul>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={isCalculating}
          icon={isCalculating ? undefined : Calculator}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg py-3"
        >
          {isCalculating ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculating Points...
            </div>
          ) : (
            'Calculate Loyalty Points'
          )}
        </Button>
      </GlassCard>
    </div>
  );
};