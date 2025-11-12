import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'LearnCrypt',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: false,
});
