import React, { useState } from 'react';
import { Calculator, Plus, Minus, ArrowRight, TrendingUp, Calendar, Coins, RotateCcw, ArrowLeft } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface AssetDeposit {
  id: string;
  asset: 'ETHFI' | 'weETHk' | 'eBTC';
  amount: string;
  startBlock: string;
  endBlock: string;
}

interface PointsRateByBlock {
  startBlock: number;
  endBlock: number;
  rate: number;
}

interface CalculationResult {
  asset: string;
  amount: number;
  startBlock: number;
  endBlock: number;
  totalPoints: number;
  breakdown: {
    period: string;
    blocks: string;
    days: number;
    rate: number;
    points: number;
  }[];
}

const ETHFI_RATES: PointsRateByBlock[] = [
  { startBlock: 20236584, endBlock: 20341633, rate: 0.96 },   // Jul 5 - Jul 19, 2024
  { startBlock: 20341633, endBlock: 20456245, rate: 1.92 },   // Jul 19 - Aug 4, 2024
  { startBlock: 20456245, endBlock: 20671103, rate: 0.96 },   // Aug 4 - Sep 3, 2024
  { startBlock: 20671103, endBlock: 20921915, rate: 0.98 },   // Sep 3 - Oct 8, 2024
  { startBlock: 20921915, endBlock: 21036512, rate: 1.17 },   // Oct 8 - Oct 24, 2024
  { startBlock: 21036512, endBlock: 21143976, rate: 1.23 },   // Oct 24 - Nov 8, 2024
  { startBlock: 21143976, endBlock: Number.MAX_SAFE_INTEGER, rate: 1.27 }, // After Nov 8, 2024
];

const WEETHK_RATES: PointsRateByBlock[] = [
  { startBlock: 20215114, endBlock: 20680665, rate: 6900.0 },  // Jul 2 - Sep 5, 2024
  { startBlock: 20680665, endBlock: 21031734, rate: 5850.0 },  // Sep 5 - Oct 24, 2024
  { startBlock: 21031734, endBlock: 21139212, rate: 5940.0 },  // Oct 24 - Nov 8, 2024
  { startBlock: 21139212, endBlock: 21139210, rate: 6900.0 },  // Nov 8 - Nov 8, 2024 (transition)
  { startBlock: 21139210, endBlock: Number.MAX_SAFE_INTEGER, rate: 121600.0 }, // After Nov 8, 2024
];

const EBTC_RATES: PointsRateByBlock[] = [
  { startBlock: 19850230, endBlock: 20917133, rate: 92000.0 },   // May 12 - Oct 8, 2024
  { startBlock: 20917133, endBlock: 21031737, rate: 99800.0 },   // Oct 8 - Oct 24, 2024
  { startBlock: 21031737, endBlock: 21139210, rate: 107600.0 },  // Oct 24 - Nov 8, 2024
  { startBlock: 21139210, endBlock: Number.MAX_SAFE_INTEGER, rate: 121600.0 }, // After Nov 8, 2024
];

const ASSET_OPTIONS = [
  { value: 'ETHFI', label: 'ETHFI' },
  { value: 'weETHk', label: 'weETHk' },
  { value: 'eBTC', label: 'eBTC' }
];

const BLOCKS_PER_DAY = 7200; // Approximate blocks per day on Ethereum

const getDateFromBlock = (blockNumber: number): string => {
  // Approximate date mapping based on known block numbers
  const blockDates: { [key: number]: string } = {
    19850230: 'May 12, 2024',
    20215114: 'Jul 2, 2024',
    20236584: 'Jul 5, 2024',
    20341633: 'Jul 19, 2024',
    20456245: 'Aug 4, 2024',
    20671103: 'Sep 3, 2024',
    20680665: 'Sep 5, 2024',
    20917133: 'Oct 8, 2024',
    20921915: 'Oct 8, 2024',
    21031734: 'Oct 24, 2024',
    21031737: 'Oct 24, 2024',
    21036512: 'Oct 24, 2024',
    21139210: 'Nov 8, 2024',
    21139212: 'Nov 8, 2024',
    21143976: 'Nov 8, 2024',
  };
  
  return blockDates[blockNumber] || `Block ${blockNumber}`;
};

export const KarakPointsCalculator: React.FC = () => {
  const [assetCount, setAssetCount] = useState(1);
  const [deposits, setDeposits] = useState<AssetDeposit[]>([
    { id: '1', asset: 'ETHFI', amount: '', startBlock: '', endBlock: '' }
  ]);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const updateAssetCount = (count: number) => {
    setAssetCount(count);
    const newDeposits = Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      asset: deposits[i]?.asset || 'ETHFI' as const,
      amount: deposits[i]?.amount || '',
      startBlock: deposits[i]?.startBlock || '',
      endBlock: deposits[i]?.endBlock || ''
    }));
    setDeposits(newDeposits);
  };

  const updateDeposit = (id: string, field: keyof AssetDeposit, value: string) => {
    setDeposits(prev => prev.map(deposit => 
      deposit.id === id ? { ...deposit, [field]: value } : deposit
    ));
  };

  const calculatePoints = (
    asset: 'ETHFI' | 'weETHk' | 'eBTC',
    amount: number,
    startBlock: number,
    endBlock: number
  ): CalculationResult => {
    const rates = asset === 'ETHFI' ? ETHFI_RATES : 
                  asset === 'weETHk' ? WEETHK_RATES : EBTC_RATES;
    
    let totalPoints = 0;
    const breakdown: CalculationResult['breakdown'] = [];

    for (const rate of rates) {
      const periodStart = Math.max(startBlock, rate.startBlock);
      const periodEnd = Math.min(endBlock, rate.endBlock);
      
      if (periodStart < periodEnd) {
        const blocks = periodEnd - periodStart;
        const days = blocks / BLOCKS_PER_DAY;
        const points = amount * rate.rate * days;
        
        totalPoints += points;
        breakdown.push({
          period: `${getDateFromBlock(rate.startBlock)} - ${rate.endBlock === Number.MAX_SAFE_INTEGER ? 'Present' : getDateFromBlock(rate.endBlock)}`,
          blocks: `${periodStart.toLocaleString()} - ${periodEnd.toLocaleString()}`,
          days: Math.round(days * 100) / 100,
          rate: rate.rate,
          points: Math.round(points * 100) / 100
        });
      }
    }

    return {
      asset,
      amount,
      startBlock,
      endBlock,
      totalPoints: Math.round(totalPoints * 100) / 100,
      breakdown
    };
  };

  const handleCalculate = async () => {
    const validDeposits = deposits.filter(d => 
      d.amount && parseFloat(d.amount) > 0 && 
      d.startBlock && d.endBlock && 
      parseInt(d.startBlock) < parseInt(d.endBlock)
    );
    
    if (validDeposits.length === 0) {
      alert('Please enter valid deposit amounts and block ranges for at least one asset');
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    const calculationResults = validDeposits.map(deposit => 
      calculatePoints(
        deposit.asset,
        parseFloat(deposit.amount),
        parseInt(deposit.startBlock),
        parseInt(deposit.endBlock)
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
    setDeposits([{ id: '1', asset: 'ETHFI', amount: '', startBlock: '', endBlock: '' }]);
  };

  const handleBack = () => {
    setShowResults(false);
  };

  const totalPoints = results.reduce((sum, result) => sum + result.totalPoints, 0);

  if (showResults) {
    return (
      <div className="space-y-6 min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Karak Points Calculator</h2>
        </div>

        <GlassCard className="space-y-8">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
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
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-200 dark:border-green-800 rounded-xl p-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-green-600 dark:text-green-400 mb-3">
                {totalPoints.toLocaleString()} Points
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-300">
                Total Karak Points Earned
              </div>
            </div>
          </div>

          {/* Individual Asset Results */}
          <div className="space-y-8">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-blue-400" />
              Asset Breakdown
            </h4>
            
            {results.map((result, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 space-y-6">
                {/* Asset Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {result.asset.charAt(0)}
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
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {result.totalPoints.toLocaleString()}
                    </div>
                    <div className="text-base text-gray-600 dark:text-gray-400">
                      total points
                    </div>
                  </div>
                </div>

                {/* Period Breakdown */}
                <div className="space-y-4">
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <Calendar className="w-5 h-5" />
                    Period Breakdown ({result.breakdown.length} periods)
                  </div>
                  
                  <div className="space-y-4">
                    {result.breakdown.map((period, periodIndex) => (
                      <div key={periodIndex} className="bg-white dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                              {period.period}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                              Block Range: {period.blocks}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {period.points.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              points earned
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="font-medium text-gray-700 dark:text-gray-300">Duration</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {period.days} days
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="font-medium text-gray-700 dark:text-gray-300">Rate</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {period.rate.toLocaleString()}/day
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="font-medium text-gray-700 dark:text-gray-300">Amount</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {result.amount.toLocaleString()} tokens
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="font-medium text-gray-700 dark:text-gray-300">Formula</div>
                            <div className="text-sm font-mono text-gray-900 dark:text-white">
                              {result.amount} × {period.rate.toLocaleString()} × {period.days}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calculation Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 text-lg">Calculation Notes</h5>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <li>• Points are calculated based on individual asset block ranges and rates</li>
              <li>• Approximately {BLOCKS_PER_DAY.toLocaleString()} blocks per day on Ethereum</li>
              <li>• For eBTC and ETHFI: Only allocated portions to Karak earn points</li>
              <li>• weETHk points are calculated directly based on token holdings</li>
              <li>• Each asset can have different deposit and withdrawal times</li>
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
        <Calculator className="w-8 h-8 text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Karak Points Calculator</h2>
      </div>

      <GlassCard className="space-y-6">
        {/* Asset Count Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Number of Assets to Deposit (1-10)
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
              onClick={() => updateAssetCount(Math.min(10, assetCount + 1))}
              disabled={assetCount >= 10}
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
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
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
                  label="Start Block"
                  type="number"
                  value={deposit.startBlock}
                  onChange={(value) => updateDeposit(deposit.id, 'startBlock', value)}
                  placeholder="e.g., 20236584"
                />
                <Input
                  label="End Block"
                  type="number"
                  value={deposit.endBlock}
                  onChange={(value) => updateDeposit(deposit.id, 'endBlock', value)}
                  placeholder="e.g., 21143976"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={isCalculating}
          icon={isCalculating ? undefined : Calculator}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-3"
        >
          {isCalculating ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculating Points...
            </div>
          ) : (
            'Calculate Points'
          )}
        </Button>
      </GlassCard>
    </div>
  );
};