// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interfaces for external protocols we need to interact with
interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface ILido {
    function submit(address _referral) external payable returns (uint256);
}

interface IWstETH {
    function wrap(uint256 _stETHAmount) external returns (uint256);
    function unwrap(uint256 _wstETHAmount) external returns (uint256);
}

/**
 * @title AutoYieldTreasury
 * @dev A treasury contract designed to be managed by an autonomous AI agent.
 * The AI Agent is granted limited permissions to execute rebalancing strategies
 * (swapping via Uniswap V3, or staking via Lido).
 * The human owner retains ultimate control over deposits and withdrawals.
 */
contract AutoYieldTreasury is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // The address of the autonomous AI agent
    address public agent;

    // External Protocol Addresses (Base Mainnet)
    address public uniswapRouter;
    address public usdcToken;
    address public wethToken;
    address public lidoContract;
    address public wstEthContract;

    // Events
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event Deposit(address indexed user, uint256 amount, bool isETH);
    event Withdrawal(address indexed user, uint256 amount, address token);
    event Swapped(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event Staked(uint256 ethAmount, uint256 wstEthAmount);

    modifier onlyAgentOrOwner() {
        require(msg.sender == owner() || msg.sender == agent, "Not authorized");
        _;
    }

    /**
     * @param _agent The wallet address of the AI Agent (e.g. from ERC-8004)
     * @param _uniswapRouter Address of Uniswap V3 Router
     * @param _usdcToken Address of USDC
     * @param _wethToken Address of WETH
     * @param _lidoContract Address of Lido (stETH)
     * @param _wstEthContract Address of wrapped stETH (wstETH)
     */
    constructor(
        address _agent,
        address _uniswapRouter,
        address _usdcToken,
        address _wethToken,
        address _lidoContract,
        address _wstEthContract
    ) Ownable(msg.sender) {
        require(_agent != address(0), "Agent cannot be zero address");
        agent = _agent;
        
        uniswapRouter = _uniswapRouter;
        usdcToken = _usdcToken;
        wethToken = _wethToken;
        lidoContract = _lidoContract;
        wstEthContract = _wstEthContract;
    }

    // ==========================================
    // Deposit / Withdraw (Owner Only)
    // ==========================================

    receive() external payable {
        emit Deposit(msg.sender, msg.value, true);
    }

    function depositERC20(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount, false);
    }

    function withdrawETH(uint256 amount) external onlyOwner nonReentrant {
        require(address(this).balance >= amount, "Insufficient ETH balance");
        (bool success, ) = owner().call{value: amount}("");
        require(success, "ETH transfer failed");
        emit Withdrawal(owner(), amount, address(0));
    }

    function withdrawERC20(address token, uint256 amount) external onlyOwner nonReentrant {
        IERC20(token).safeTransfer(owner(), amount);
        emit Withdrawal(owner(), amount, token);
    }

    // ==========================================
    // Agent Execution Capabilities
    // ==========================================

    function setAgent(address _newAgent) external onlyOwner {
        require(_newAgent != address(0), "Invalid agent address");
        emit AgentUpdated(agent, _newAgent);
        agent = _newAgent;
    }

    /**
     * @dev Allows the agent to swap USDC for WETH using Uniswap V3
     */
    function swapUSDCForWETH(uint256 amountIn, uint256 amountOutMin) external onlyAgentOrOwner nonReentrant {
        require(IERC20(usdcToken).balanceOf(address(this)) >= amountIn, "Insufficient USDC");
        
        // Approve router
        IERC20(usdcToken).safeIncreaseAllowance(uniswapRouter, amountIn);

        ISwapRouter02.ExactInputSingleParams memory params = ISwapRouter02.ExactInputSingleParams({
            tokenIn: usdcToken,
            tokenOut: wethToken,
            fee: 500, // 0.05% pool fee tier typically
            recipient: address(this),
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = ISwapRouter02(uniswapRouter).exactInputSingle(params);
        emit Swapped(usdcToken, wethToken, amountIn, amountOut);
    }

    /**
     * @dev Allows the agent to swap WETH for USDC using Uniswap V3
     */
    function swapWETHForUSDC(uint256 amountIn, uint256 amountOutMin) external onlyAgentOrOwner nonReentrant {
        require(IERC20(wethToken).balanceOf(address(this)) >= amountIn, "Insufficient WETH");
        
        // Approve router
        IERC20(wethToken).safeIncreaseAllowance(uniswapRouter, amountIn);

        ISwapRouter02.ExactInputSingleParams memory params = ISwapRouter02.ExactInputSingleParams({
            tokenIn: wethToken,
            tokenOut: usdcToken,
            fee: 500,
            recipient: address(this),
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = ISwapRouter02(uniswapRouter).exactInputSingle(params);
        emit Swapped(wethToken, usdcToken, amountIn, amountOut);
    }

    /**
     * @dev Allows the agent to stake raw ETH into Lido, getting wstETH
     */
    function stakeETHToLido(uint256 amountETH) external onlyAgentOrOwner nonReentrant {
        require(address(this).balance >= amountETH, "Insufficient ETH");
        
        // Submit raw ETH to Lido to get stETH
        uint256 stEthReceived = ILido(lidoContract).submit{value: amountETH}(address(0));
        require(stEthReceived > 0, "Lido submit failed");

        // Approve wstEth contract to wrap our stETH
        IERC20(lidoContract).safeIncreaseAllowance(wstEthContract, stEthReceived);

        // Wrap to wstETH
        uint256 wstEthReceived = IWstETH(wstEthContract).wrap(stEthReceived);
        
        emit Staked(amountETH, wstEthReceived);
    }
}
