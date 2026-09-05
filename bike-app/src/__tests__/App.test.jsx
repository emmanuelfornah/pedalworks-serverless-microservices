import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import axios from "axios";
import App from "../App";
import Products from "../components/Products";

vi.mock("axios");

// Default: the products API returns an empty catalog unless a test overrides it
axios.get.mockResolvedValue({ data: [] });

describe("Renders main page correctly", async () => {
  afterEach(() => {
    cleanup();
  });

  it("Should render the main page correctly", async () => {
    // Setup
    await render(<App />);
    const h1 = await screen.queryByText("PedalWorks bicycle parts");

    // Expectations
    expect(h1).not.toBeNull();
  });

  it("Should show the current year in the copyrights", async () => {
    // Setup
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
    // Setup — mock the products API response
    axios.get.mockResolvedValue({
      data: [
        { id: "1", product_name: "wheel", price: "179.00", image_url: "images/wheel.jpeg" },
        { id: "2", product_name: "chain", price: "35.00", image_url: "images/chain.jpeg" },
        { id: "3", product_name: "seat", price: "89.00", image_url: "images/seat.jpeg" },
      ],
    });

    const { container } = render(<Products />);

    // Wait for the mocked API response to render the 3 products
    await waitFor(() => {
      expect(container.getElementsByClassName("product-item").length).toBe(3);
    });
  });
});