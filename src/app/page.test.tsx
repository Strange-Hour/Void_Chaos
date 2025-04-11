import { render, screen } from "@testing-library/react";
import Home from "./page";

// Mock the GameCanvas component since we'll test it separately
jest.mock("@components/GameCanvas", () => {
  return function MockGameCanvas() {
    return <div data-testid='game-canvas'>Mock Game Canvas</div>;
  };
});

describe("Home", () => {
  it("should render the main container", () => {
    render(<Home />);
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass("min-h-screen", "p-8", "bg-black");
  });

  it("should render the GameCanvas component", () => {
    render(<Home />);
    const gameCanvas = screen.getByTestId("game-canvas");
    expect(gameCanvas).toBeInTheDocument();
  });
});
