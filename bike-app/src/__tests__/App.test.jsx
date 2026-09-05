import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import axios from "axios";
import App from "../App";
import Products from "../components/Products";

// Mock axios so Products does not hit the live API during tests.
vi.mock("axios");

const mockProducts = [
  { id: "1", product_name: "cassette", price: "50.00", inventory_count: 12, image_url: "cassette.jpeg" },
  { id: "2", product_name: "chain", price: "35.00", inventory_count: 30, image_url: "chain.jpeg" },
  { id: "3", product_name: "wheel", price: "179.00", inventory_count: 10, image_url: "wheel.jpeg" },
];

describe("Renders main page correctly", async () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("Should render the main page correctly", async () => {
    // Setup
    axios.get.mockResolvedValue({ data: [] });
    await render(<App />);
    const h1 = await screen.queryByText("PedalWorks bicycle parts");

    // Expectations
    expect(h1).not.toBeNull();
  });

  it("Should show the current year in the copyrights", async () => {
    // Setup
    axios.get.mockResolvedValue({ data: [] });
    await render(<App />);
    const year = new Date().getFullYear();
    const copyrights = await screen.queryByText(
      "© " +
        year +
        " PedalWorks. All rights reserved."
    );

    // Expectations
    expect(copyrights).not.toBeNull();
  });

  it("Should show a light banner after cliking on button", async () => {
    // Setup
    axios.get.mockResolvedValue({ data: [] });
    const { container } = await render(<App />);
    const banner = container.getElementsByClassName("banner");
    const button = await screen.queryByText("Light Banner");

    // Pre Expectations
    expect(banner).not.toBeNull();
    expect(banner[0].classList.contains("banner-dark")).toBe(true);
    expect(button).not.toBeNull();

    // Actions
    //fireEvent.click(button as HTMLElement);
    fireEvent.click(button);

    // Post Expectations
    expect(banner[0].classList.contains("banner-light")).toBe(true);
  });

  it("Should show 3 products", async () => {
    // Setup — mock the API response the Products component fetches on mount
    axios.get.mockResolvedValue({ data: mockProducts });
    const { container } = await render(<Products />);

    // Wait for the fetched products to render as cards
    await waitFor(() => {
      const products = container.getElementsByClassName("product-item");
      expect(products.length).toBe(3);
    });
  });

  it("Should render products when API returns a { products: [...] } object", async () => {
    // The deployed Lambda wraps items in an object — verify the component
    // normalizes it instead of rendering nothing.
    axios.get.mockResolvedValue({ data: { products: mockProducts, count: 3 } });
    const { container } = await render(<Products />);

    await waitFor(() => {
      const products = container.getElementsByClassName("product-item");
      expect(products.length).toBe(3);
    });
  });
});