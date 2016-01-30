import React from 'react';
import jQuery from 'jquery';

// Display imports
import TopBar from '../Common/TopBar';
import Counter from './Counter';
import BoardLayout from './BoardLayout';
import BottomFrame from './BottomFrame';

// Logic imports
import BoardFactory from '../board/BoardFactory';
import Solver from '../AI/Solver';
// import Solver from '../AI/PartialSolver';

export default class App extends React.Component {

  /**
   * Initaial state of the game. The board generation is given to factory.
   * @return {JSON} A dict of key value pairs
   */
  constructor() {
    super();
    let size = 4;
    let bf = new BoardFactory(size);
    let board = bf.getBoard();

    this.state = {
      N: size,
      board: board,
      count: 0,
      won: false,
      autosolve: false,
      solution: null,
      solvable: true,
      processing: false
    };

    // In es6 there is no autobinding
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseClick = this.handleMouseClick.bind(this);
    this.reset = this.reset.bind(this);
    this.activateAutoSolve = this.activateAutoSolve.bind(this);
    this.changeGame = this.changeGame.bind(this);
  }

  /**
  * Start Polling keydown event
  */
  componentDidMount() {
    jQuery(document.body).on('keydown', this.handleKeyDown);
  }

  /**
  * Stop Polling keydown event
  */
  componentWillUnmount() {
    jQuery(document.body).off('keydown', this.handleKeyDown);
  }

  /**
  * Calls the appropriate method in board class on keydown event if the
  * key pressed is one of the arrow keys.
  *
  * @param  {event} e An event object.
  */
  handleKeyDown(e) {
    if (this.state.won || this.state.autosolve) {
      return;
    }

    // Arrow key codes: LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
    // hence the function to call move on the blank tile is inverted so it
    // is more natural to the user.
    let move = ['moveRight', 'moveDown', 'moveLeft', 'moveUp'];

    if (e.keyCode > 36 && e.keyCode < 41) {
      this.state.board[move[e.keyCode - 37]]();
      this.state.count += 1;
    }

    this.setState({
      board: this.state.board,
      count: this.state.count
    });

    if (this.state.board.isGoal()) {
      this.setState({won: true});
    }
  }

  /**
   * Calls the move method on the board class when any of the numbers are pressed
   * on by the mouse.
   *
   * @param {Integer} number the number that is pressed
   */
  handleMouseClick(number) {
    if (this.state.won || this.state.autosolve) {
      return;
    }

    let moved = this.state.board.move(number);
    this.setState({
      board: this.state.board,
      count: this.state.count + (moved ? 1 : 0)
    });

    if (this.state.board.isGoal()) {
      this.setState({won: true});
    }
  }

  /**
  * Resets the game to it's original configuration.
  * The arrangement of tiles is randomised
  */
  reset() {
    let board = new BoardFactory(this.state.N).getBoard();

    // VERY IMPORTANT: to clear the setInterval otherwise reseting
    // will have two solutions to pick from and it's not preety
    clearInterval(this.AIPlayingTheGame);

    this.setState({
      board: board,
      count: 0,
      won: false,
      autosolve: false,
      solution: null,
      solutionIndex: 1
    }, function() {
      this.setState({solvable: this.state.board.isSolvable()});
    });

    this.forceUpdate();
  }

  /**
  * This function autosolves the game on the screen and stores the result in
  * solution (state variable) and then calls the helper to present the moves
  * to the user
  */
  activateAutoSolve() {
    this.setState({autosolve: true }, function() {
      // Calling the AI to solve the problem
      let solver = new Solver(this.state.board);

      // Scnchronously calll the helper after setting the state with the
      // solution
      this.setState({ solution: solver.solution()}, function() {
        this.__autosolveTheGame__();
      });
    });
  }

  // Helper: Reads the boards in solution one by one and renders then on to
  // the screen one-by-one.
  __autosolveTheGame__() {
    let i = 1;
    let length = this.state.solution.length;

    // display the next board after a second interval
    this.AIPlayingTheGame = setInterval(() => {
      this.setState({
        board: this.state.solution[i],
        count: this.state.count + 1
      });

      // quit on reaching the solved state
      if (++i === length) {
        this.setState({ won: true });
        clearInterval(this.AIPlayingTheGame);
      }
    }, 1000);
  }

  /**
  * Changes the game to different n-by-n grid
  */
  changeGame(n) {
    this.setState({solvable: this.state.board.isSolvable()});
    // Imediate change in state is trigerred like this (synchronos operation)
    this.setState({N: n}, function() {
      this.reset();
    });
  }

  /**
  * Render method
  * @return {React class} Returns a react class
  */
  render() {
    return (
      <div>
        <TopBar N={this.state.N} changeGame={this.changeGame} />
        <br />
        <Counter reset={this.reset}
          count={this.state.count}
          N={this.state.N} />
        <BoardLayout N={this.state.N} board={this.state.board.board}
          onMouseClick={this.handleMouseClick} />
        <BottomFrame won={this.state.won}
          N={this.state.N}
          solvable={this.state.solvable}
          activateAI={this.activateAutoSolve}
          autosolve={this.state.autosolve} />
      </div>
    );
  }
}
