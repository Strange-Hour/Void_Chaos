import { render } from "@testing-library/react";
import RootLayout from "./layout";

// Mock the next/font/google module
jest.mock("next/font/google", () => ({
  Geist: () => ({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  }),
  Geist_Mono: () => ({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  }),
}));

// Create a custom render function for Next.js app router components
const renderWithNextRouter = (ui: React.ReactElement) => {
  return render(ui, {
    container: document.documentElement,
  });
};

describe("RootLayout", () => {
  beforeEach(() => {
    // Reset the document body before each test
    document.documentElement.innerHTML = "";
  });

  it("should render with proper font classes and lang attribute", () => {
    renderWithNextRouter(
      <RootLayout>
        <div data-testid='child'>Test Child</div>
      </RootLayout>
    );

    // Check for font classes
    expect(document.body).toHaveClass(
      "--font-geist-sans",
      "--font-geist-mono",
      "antialiased"
    );

    // Check for lang attribute
    expect(document.documentElement).toHaveAttribute("lang", "en");
  });

  it("should render children content", () => {
    const { getByTestId } = renderWithNextRouter(
      <RootLayout>
        <div data-testid='test-content'>Test Content</div>
      </RootLayout>
    );

    expect(getByTestId("test-content")).toBeInTheDocument();
    expect(getByTestId("test-content")).toHaveTextContent("Test Content");
  });
});
